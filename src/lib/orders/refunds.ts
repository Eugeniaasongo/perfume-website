import { prisma } from "@/lib/prisma";
import { PaystackProvider } from "@/lib/payments/paystack";
import { notifyOrderStatus } from "@/lib/notifications/orders";
import { canTransition, transitionOrderStateTx, type OrderState } from "@/lib/orders/state-machine";

export class RefundError extends Error {}

/**
 * Refunds all or part of an order. Paystack orders are refunded through Paystack; Cash on
 * Delivery refunds are paid back by hand (cash/MoMo) and recorded here.
 */
export async function refundOrder(input: { orderId: string; amountPesewas: number; reason: string; actor: string }) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { paymentLedgers: true, codLogs: true },
  });
  if (!order) throw new RefundError("Order not found");

  const amount = Math.round(input.amountPesewas);
  const refundable = refundableAmount(order);
  if (refundable <= 0) throw new RefundError("Nothing has been paid on this order yet, so there is nothing to refund");
  if (amount <= 0) throw new RefundError("Enter an amount greater than zero");
  if (amount > refundable) throw new RefundError(`At most ${(refundable / 100).toFixed(2)} GHS can still be refunded`);

  const isFull = amount === refundable;
  const current = order.status as OrderState;
  const target: OrderState = isFull ? "REFUNDED" : "PARTIALLY_REFUNDED";
  const needsTransition = current !== target;
  if (needsTransition && !canTransition(current, target)) {
    throw new RefundError(`A ${isFull ? "full" : "partial"} refund isn't possible while the order is ${current}`);
  }

  const refundCount = order.paymentLedgers.filter((l) => l.status === "REFUNDED").length + 1;
  let ledger: { provider: string; reference: string };

  if (order.paymentProvider === "PAYSTACK") {
    const charge = order.paymentLedgers.find((l) => l.provider === "PAYSTACK" && l.status === "SUCCESS");
    if (!charge) throw new RefundError("No successful Paystack payment found for this order");
    const { refundId } = await new PaystackProvider().refundTransaction(charge.reference, amount);
    ledger = { provider: "PAYSTACK", reference: `${charge.reference}:refund:${refundId}` };
  } else {
    ledger = { provider: "COD_MANUAL", reference: `${order.orderNumber}:refund:${refundCount}` };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.paymentLedger.create({
        data: {
          orderId: order.id,
          provider: ledger.provider,
          reference: ledger.reference,
          amountPesewas: amount,
          status: "REFUNDED",
          metadataJson: JSON.stringify({ reason: input.reason, actor: input.actor }),
        },
      });
      await tx.order.update({ where: { id: order.id }, data: { refundedAmount: { increment: amount } } });
      if (needsTransition) {
        await transitionOrderStateTx(tx, {
          orderId: order.id,
          targetState: target,
          actor: input.actor,
          notes: `Refunded ${(amount / 100).toFixed(2)} GHS: ${input.reason}`,
        });
      } else {
        await tx.auditLog.create({
          data: {
            orderId: order.id,
            actor: input.actor,
            action: "REFUND_ISSUED",
            details: `Refunded ${(amount / 100).toFixed(2)} GHS: ${input.reason}`,
          },
        });
      }
    });
  } catch (error) {
    if (order.paymentProvider === "PAYSTACK") {
      // The money has already left via Paystack; make sure this is impossible to miss.
      console.error(`CRITICAL: Paystack refund ${ledger.reference} succeeded but was not recorded`, error);
      throw new RefundError(
        `Paystack issued the refund (${ledger.reference}) but saving it failed. Record it manually before retrying.`
      );
    }
    throw error;
  }

  await notifyOrderStatus(order.id, target);
  return { amount, target, reference: ledger.reference };
}

/** What has been collected from the customer and not yet refunded. */
export function refundableAmount(order: {
  paymentProvider: string;
  status: string;
  totalPrice: number;
  refundedAmount: number;
  paymentLedgers: { provider: string; status: string; amountPesewas: number }[];
  codLogs: { collectedAmount: number }[];
}): number {
  const collected =
    order.paymentProvider === "PAYSTACK"
      ? order.paymentLedgers
          .filter((l) => l.provider === "PAYSTACK" && l.status === "SUCCESS")
          .reduce((sum, l) => sum + l.amountPesewas, 0)
      : // Cash on Delivery money only exists once a rider has recorded collecting it.
        order.codLogs.reduce((sum, c) => sum + c.collectedAmount, 0);
  return Math.max(0, collected - order.refundedAmount);
}
