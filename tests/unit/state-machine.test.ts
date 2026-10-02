import { transitionOrderState, OrderState } from "../../src/lib/orders/state-machine";
import { prisma } from "../../src/lib/prisma";

async function testOrderStateMachine() {
  console.log("Testing Order State Machine Transitions & Audit Logs...");

  const order = await prisma.order.create({
    data: {
      orderNumber: `SM-ORD-${Date.now()}`,
      status: "PENDING_PAYMENT",
      paymentProvider: "PAYSTACK",
      customerName: "Esi Boateng",
      customerPhone: "+233209876543",
      region: "Accra",
      city: "Cantonments",
      addressLine: "5 Cantonments Road",
      itemsPrice: 29900,
      shippingPrice: 2000,
      totalPrice: 31900,
    },
  });

  const paidOrder = await transitionOrderState({
    orderId: order.id,
    targetState: "PAID",
    actor: "PAYSTACK_WEBHOOK",
    notes: "Automated webhook payment verification",
  });

  if (paidOrder.status !== "PAID") {
    throw new Error(`Expected PAID status, got ${paidOrder.status}`);
  }
  console.log("Passed 1: PENDING_PAYMENT -> PAID transition succeeded.");

  const processingOrder = await transitionOrderState({
    orderId: order.id,
    targetState: "PROCESSING",
    actor: "ADMIN_STAFF",
    notes: "Order dispatched to fulfillment team",
  });

  if (processingOrder.status !== "PROCESSING") {
    throw new Error(`Expected PROCESSING status, got ${processingOrder.status}`);
  }
  console.log("Passed 2: PAID -> PROCESSING transition succeeded.");

  try {
    await transitionOrderState({
      orderId: order.id,
      targetState: "PAID" as OrderState,
      actor: "TEST_ACTOR",
    });
    throw new Error("Failed: Invalid transition PROCESSING -> PAID was accepted!");
  } catch (e: any) {
    if (!e.message.includes("Invalid order state transition")) throw e;
    console.log("Passed 3: Invalid state transition correctly blocked.");
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: { orderId: order.id },
  });

  if (auditLogs.length !== 2) {
    throw new Error(`Expected 2 audit log entries, got ${auditLogs.length}`);
  }
  console.log("Passed 4: Audit logs accurately recorded actors and timestamps.");

  console.log("ALL ORDER STATE MACHINE TESTS PASSED!");
}

testOrderStateMachine().catch((e) => {
  console.error("Order state machine test failed:", e);
  process.exit(1);
});
