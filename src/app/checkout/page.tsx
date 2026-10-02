"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StorefrontLayoutShell } from "@/components/layout/StorefrontLayoutShell";
import { ShieldCheck, CreditCard, Truck, Smartphone } from "lucide-react";
import { getCart, clearCart, CartItem } from "@/lib/cart";

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    region: "Accra",
    city: "",
    addressLine: "",
    landmark: "",
    paymentProvider: "CASH_ON_DELIVERY",
    discountCode: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const items = getCart();
    if (items.length > 0) {
      setCartItems(items);
    } else {
      // Fallback default sample item if checkout is loaded directly
      setCartItems([
        {
          variantId: "RYZ-RO-100ML",
          productId: "prod_royal_oud",
          productName: "Royal Oud",
          size: "100ml",
          pricePesewas: 34900,
          imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80",
          quantity: 1,
        },
      ]);
    }
  }, []);

  const handleSendOtp = async () => {
    if (!formData.customerPhone) {
      alert("Please enter a valid Ghana phone number first");
      return;
    }
    try {
      const res = await fetch("/api/checkout/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.customerPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        alert(`OTP code sent! (Sandbox Test Code: ${data.otp})`);
      } else {
        alert(data.error || "Failed to send OTP");
      }
    } catch {
      alert("Failed to connect to OTP service");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          otp: otpInput,
          items: cartItems.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        clearCart();
        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
        } else {
          router.push(`/tracking?orderNumber=${data.orderNumber}`);
        }
      } else {
        alert(data.error || "Checkout failed");
      }
    } catch {
      alert("Error submitting order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemsTotalPesewas = cartItems.reduce(
    (sum, item) => sum + item.pricePesewas * item.quantity,
    0
  );

  return (
    <StorefrontLayoutShell>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] mb-2 block">
            Secure Delivery & Payment
          </span>
          <h1 className="text-3xl font-extrabold uppercase tracking-wider text-black">
            Checkout
          </h1>
          <div className="w-16 h-0.5 bg-brand-gold mx-auto mt-3" />
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer & Address Information */}
          <div className="space-y-4 border border-neutral-200 bg-white p-6">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-black border-b border-neutral-200 pb-2 flex items-center gap-2">
              <Truck size={16} className="text-brand-gold" />
              1. Delivery Information
            </h2>

            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1">
                Full Name *
              </label>
              <input
                required
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Kofi Mensah"
                className="w-full border border-neutral-300 p-2 text-xs focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1">
                Phone Number (for Delivery & OTP) *
              </label>
              <input
                required
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+233 20 000 0000"
                className="w-full border border-neutral-300 p-2 text-xs focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="kofi@example.com"
                className="w-full border border-neutral-300 p-2 text-xs focus:outline-none focus:border-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1">
                  Region *
                </label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full border border-neutral-300 p-2 text-xs focus:outline-none focus:border-black bg-white"
                >
                  <option value="Accra">Accra Central</option>
                  <option value="Greater Accra">Greater Accra</option>
                  <option value="Ashanti">Ashanti Region</option>
                  <option value="Western">Western Region</option>
                  <option value="Central">Central Region</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1">
                  City / Town *
                </label>
                <input
                  required
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="East Legon"
                  className="w-full border border-neutral-300 p-2 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-neutral-700 mb-1">
                Street Address / Digital Address *
              </label>
              <input
                required
                type="text"
                value={formData.addressLine}
                onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                placeholder="House 14, Palm Street, GA-123-4567"
                className="w-full border border-neutral-300 p-2 text-xs focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Payment Method & Order Summary */}
          <div className="space-y-4 border border-neutral-200 bg-neutral-50 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-black border-b border-neutral-200 pb-2 flex items-center gap-2">
                <CreditCard size={16} className="text-brand-gold" />
                2. Payment Method
              </h2>

              <div className="space-y-2">
                <label className="flex items-center gap-3 border p-3 bg-white cursor-pointer hover:border-black">
                  <input
                    type="radio"
                    name="paymentProvider"
                    value="CASH_ON_DELIVERY"
                    checked={formData.paymentProvider === "CASH_ON_DELIVERY"}
                    onChange={(e) => setFormData({ ...formData, paymentProvider: e.target.value })}
                  />
                  <div>
                    <span className="text-xs font-bold uppercase text-black block">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      Pay with Cash or MoMo upon delivery (OTP verified)
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 border p-3 bg-white cursor-pointer hover:border-black">
                  <input
                    type="radio"
                    name="paymentProvider"
                    value="PAYSTACK"
                    checked={formData.paymentProvider === "PAYSTACK"}
                    onChange={(e) => setFormData({ ...formData, paymentProvider: e.target.value })}
                  />
                  <div>
                    <span className="text-xs font-bold uppercase text-black block">
                      Pay Now via Paystack
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      MTN MoMo, Telecel Cash, AirtelTigo & Cards
                    </span>
                  </div>
                </label>
              </div>

              {/* Phone OTP Verification step for COD */}
              {formData.paymentProvider === "CASH_ON_DELIVERY" && (
                <div className="bg-white border border-brand-gold/40 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-gold-dark uppercase">
                    <Smartphone size={16} className="text-brand-gold" />
                    <span>Phone OTP Verification</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="flex-1 border border-neutral-300 p-2 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="bg-black text-white px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-black transition-colors"
                    >
                      {otpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-4 space-y-2">
                <div className="text-xs font-bold uppercase text-neutral-700">Order Items</div>
                {cartItems.map((item) => (
                  <div key={item.variantId} className="flex justify-between text-xs text-neutral-600">
                    <span>
                      {item.productName} ({item.size}) x {item.quantity}
                    </span>
                    <span className="font-bold text-black">
                      GHS {((item.pricePesewas * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-neutral-200 pt-4">
              <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-brand-gold-dark uppercase">
                <ShieldCheck size={16} className="text-brand-gold" />
                <span>CASH ON DELIVERY ACCEPTED</span>
              </div>

              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-black text-white py-3.5 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold hover:text-black transition-all shadow-lg"
              >
                {isSubmitting ? "Processing..." : `Confirm & Place Order (GHS ${(itemsTotalPesewas / 100).toFixed(2)})`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </StorefrontLayoutShell>
  );
}
