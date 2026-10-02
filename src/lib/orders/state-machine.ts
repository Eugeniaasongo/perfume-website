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

const allowedTransitions: Record<OrderState, OrderState[]> = {
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
  PAYMENT_FAILED: ["PENDING_PAYMENT"],
  ON_HOLD: ["PENDING_PAYMENT", "AWAITING_DELIVERY_PAYMENT", "PROCESSING", "CANCELLED"],
  RETURNED_REFUSED: ["REFUNDED"],
};

export async function transitionOrderState(input: {
  orderId: string;
  targetState: OrderState;
  actor: string;
  notes?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
  });

  if (!order) {
    throw new Error(`Order ${input.orderId} not found`);
  }

  const currentState = order.status as OrderState;
  const validNextStates = allowedTransitions[currentState] || [];

  if (!validNextStates.includes(input.targetState)) {
    throw new Error(
      `Invalid order state transition from ${currentState} to ${input.targetState}`
    );
  }

  const result = await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: input.targetState },
    }),
    prisma.auditLog.create({
      data: {
        orderId: order.id,
        actor: input.actor,
        action: `STATE_TRANSITION_${currentState}_TO_${input.targetState}`,
        details: input.notes || `Order transition by ${input.actor}`,
      },
    }),
  ]);

  return result[0];
}
