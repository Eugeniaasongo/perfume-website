import { prisma } from "@/lib/prisma";
import { transitionOrderStateTx, type OrderState } from "@/lib/orders/state-machine";
import { notifyOrderStatus } from "@/lib/notifications/orders";

export async function recordCodCashCollection(input: {
  orderId: string;
  collectedAmountPesewas: number;
  collectorName: string;
  notes?: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: input.orderId } });

    if (!order) {
      throw new Error(`Order ${input.orderId} not found`);
    }
    if (order.paymentProvider !== "CASH_ON_DELIVERY") {
      throw new Error("Cash collection can only be recorded for Cash on Delivery orders");
    }

    const isAmountMatch = order.totalPrice === input.collectedAmountPesewas;

    const log = await tx.codReconciliationLog.create({
      data: {
        orderId: order.id,
        collectedAmount: input.collectedAmountPesewas,
        collectorName: input.collectorName,
        isReconciled: isAmountMatch,
        notes: input.notes || (isAmountMatch ? "Full cash collected" : "Amount discrepancy flagged"),
      },
    });

    const targetState: OrderState = isAmountMatch ? "DELIVERED" : "ON_HOLD";
    const changed = order.status !== targetState;
    if (changed) {
      await transitionOrderStateTx(tx, {
        orderId: order.id,
        targetState,
        actor: input.collectorName,
        notes: isAmountMatch
          ? "COD cash collected in full"
          : `COD discrepancy: expected ${order.totalPrice}, collected ${input.collectedAmountPesewas} pesewas`,
      });
    }

    return { log, targetState: changed ? targetState : undefined };
  });

  if (result.targetState) await notifyOrderStatus(input.orderId, result.targetState);
  return result.log;
}
