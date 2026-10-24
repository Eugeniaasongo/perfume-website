import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type OrderState =
  | "PENDING_PAYMENT"
  | "AWAITING_DELIVERY_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "PAYMENT_FAILED"
  | "ON_HOLD"
  | "RETURNED_REFUSED";

export const ORDER_STATE_LABELS: Record<OrderState, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  AWAITING_DELIVERY_PAYMENT: "Pay on delivery",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  PROCESSING: "Preparing",
  SHIPPED: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
  PAYMENT_FAILED: "Payment failed",
  ON_HOLD: "On hold",
  RETURNED_REFUSED: "Returned / refused",
};

export const allowedTransitions: Record<OrderState, OrderState[]> = {
  PENDING_PAYMENT: ["PAID", "PAYMENT_FAILED", "CANCELLED", "ON_HOLD"],
  AWAITING_DELIVERY_PAYMENT: ["CONFIRMED", "CANCELLED", "ON_HOLD", "DELIVERED"],
  PAID: ["PROCESSING", "REFUNDED", "PARTIALLY_REFUNDED", "ON_HOLD", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED", "ON_HOLD"],
  PROCESSING: ["SHIPPED", "ON_HOLD", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED_REFUSED", "ON_HOLD"],
  DELIVERED: ["RETURNED_REFUSED", "REFUNDED", "PARTIALLY_REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ["REFUNDED"],
  PAYMENT_FAILED: ["CANCELLED", "ON_HOLD"],
  ON_HOLD: ["PENDING_PAYMENT", "AWAITING_DELIVERY_PAYMENT", "PROCESSING", "CANCELLED", "DELIVERED"],
  RETURNED_REFUSED: ["REFUNDED"],
};

/** States in which the order's reserved stock goes back on the shelf. */
const STOCK_RELEASING_STATES: OrderState[] = ["CANCELLED", "PAYMENT_FAILED", "RETURNED_REFUSED"];

export function canTransition(from: OrderState, to: OrderState): boolean {
  return (allowedTransitions[from] || []).includes(to);
}

/**
 * Moves an order to a new state inside an existing transaction, writing an audit log entry
 * and returning reserved stock when the order will no longer be fulfilled.
 * The status update is conditional on the state we read, so concurrent transitions can't both win.
 */
export async function transitionOrderStateTx(
  tx: Prisma.TransactionClient,
  input: { orderId: string; targetState: OrderState; actor: string; notes?: string }
) {
  const order = await tx.order.findUnique({
    where: { id: input.orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error(`Order ${input.orderId} not found`);
  }

  const currentState = order.status as OrderState;
  if (!canTransition(currentState, input.targetState)) {
    throw new Error(`Invalid order state transition from ${currentState} to ${input.targetState}`);
  }

  const releaseStock = STOCK_RELEASING_STATES.includes(input.targetState) && !order.stockReleased;

  const updated = await tx.order.updateMany({
    where: { id: order.id, status: currentState },
    data: { status: input.targetState, ...(releaseStock ? { stockReleased: true } : {}) },
  });
  if (updated.count !== 1) {
    throw new Error("Order was updated concurrently, please retry");
  }

  if (releaseStock) {
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  await tx.auditLog.create({
    data: {
      orderId: order.id,
      actor: input.actor,
      action: `STATE_TRANSITION_${currentState}_TO_${input.targetState}`,
      details: input.notes || `Order transition by ${input.actor}`,
    },
  });

  return { ...order, status: input.targetState, stockReleased: order.stockReleased || releaseStock };
}

export async function transitionOrderState(input: {
  orderId: string;
  targetState: OrderState;
  actor: string;
  notes?: string;
}) {
  return prisma.$transaction((tx) => transitionOrderStateTx(tx, input));
}

/** Cancels online-payment orders that were never paid so their stock is released. */
export async function expireStalePendingOrders(olderThanMs = 60 * 60 * 1000): Promise<number> {
  const stale = await prisma.order.findMany({
    where: { status: "PENDING_PAYMENT", createdAt: { lt: new Date(Date.now() - olderThanMs) } },
    select: { id: true },
    take: 100,
  });

  let expired = 0;
  for (const { id } of stale) {
    try {
      await transitionOrderState({
        orderId: id,
        targetState: "CANCELLED",
        actor: "SYSTEM",
        notes: "Payment not completed within the reservation window",
      });
      expired++;
    } catch (error) {
      console.error(`Failed to expire order ${id}:`, error);
    }
  }
  return expired;
}
