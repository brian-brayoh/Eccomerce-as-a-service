"use client";

import { useState, useEffect, useRef } from "react";
import { searchProducts, placePosOrder } from "./actions";

type Product = {
  id: string; name: string; price: number; salePrice: number | null;
  brand: string | null; sku: string | null; stock: number; imageUrl: string | null;
};

type CartItem = Product & { quantity: number; unitPrice: number };

type Phase = "idle" | "placing" | "mpesa_waiting" | "success" | "error";

function fmt(n: number) { return "KES " + n.toLocaleString("en-KE"); }

export default function PosClient({ mpesaEnabled }: { mpesaEnabled: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_DELIVERY" | "MPESA">("CASH_ON_DELIVERY");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [lastOrderId, setLastOrderId] = useState("");
  const [mpesaPollCount, setMpesaPollCount] = useState(0);
  const pollTimer = useRef<ReturnType<typeof setInterval>>();
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const searchRef = useRef<HTMLInputElement>(null);

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  // Auto-search as the user types
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      const products = await searchProducts(query);
      setResults(products.map((p: any) => ({
        id: p.id, name: p.name, brand: p.brand, sku: p.sku, stock: p.stock,
        price: p.price.toNumber ? p.price.toNumber() : p.price,
        salePrice: p.salePrice ? (p.salePrice.toNumber ? p.salePrice.toNumber() : p.salePrice) : null,
        imageUrl: p.images?.[0]?.url ?? null,
      })));
    }, 250);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  // Poll M-Pesa status
  useEffect(() => {
    if (phase !== "mpesa_waiting" || !lastOrderId) return;
    setMpesaPollCount(0);

    pollTimer.current = setInterval(async () => {
      setMpesaPollCount((c) => {
        if (c >= 40) {
          clearInterval(pollTimer.current);
          setPhase("error");
          setMessage("Payment timed out. Mark as paid manually in Orders if customer completes it.");
          return c;
        }
        return c + 1;
      });

      try {
        const res = await fetch(`/api/mpesa/status?orderId=${lastOrderId}`);
        const data = await res.json();
        if (data.paymentStatus === "SUCCESS") {
          clearInterval(pollTimer.current);
          setPhase("success");
          setMessage(`✓ M-Pesa payment confirmed! Order #${lastOrderId.slice(-6).toUpperCase()}`);
        } else if (data.paymentStatus === "FAILED") {
          clearInterval(pollTimer.current);
          setPhase("error");
          setMessage("Payment was cancelled or failed. Try again or collect cash.");
        }
      } catch {}
    }, 3000);

    return () => clearInterval(pollTimer.current);
  }, [phase, lastOrderId]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => i.id === product.id
          ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) }
          : i);
      }
      return [...prev, { ...product, quantity: 1, unitPrice: product.salePrice ?? product.price }];
    });
    setQuery("");
    setResults([]);
    searchRef.current?.focus();
  }

  function updateQty(id: string, qty: number) {
    if (qty < 1) { setCart((prev) => prev.filter((i) => i.id !== id)); return; }
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: Math.min(qty, i.stock) } : i));
  }

  async function handlePlaceOrder() {
    if (cart.length === 0) { setMessage("Add items first"); return; }
    if (paymentMethod === "MPESA" && !mpesaPhone && !customerPhone) {
      setMessage("Enter a phone number for M-Pesa"); return;
    }

    setPhase("placing"); setMessage("");

    const formData = new FormData();
    formData.set("items", JSON.stringify(cart.map((i) => ({ productId: i.id, quantity: i.quantity }))));
    formData.set("customerName", customerName || "Walk-in customer");
    formData.set("customerPhone", customerPhone);
    formData.set("paymentMethod", paymentMethod);
    formData.set("mpesaPhone", mpesaPhone || customerPhone);
    formData.set("couponCode", couponCode);

    const result = await placePosOrder(formData);

    if (result?.error) {
      setPhase("error");
      setMessage(result.error);
      return;
    }

    setLastOrderId(result.orderId!);

    if (result.mpesaPending) {
      setPhase("mpesa_waiting");
      setMessage(`STK Push sent to ${mpesaPhone || customerPhone}. Waiting for payment…`);
    } else {
      setPhase("success");
      setMessage(`✓ Sale complete! Order #${result.orderId!.slice(-6).toUpperCase()} — ${fmt(total)} received`);
    }
  }

  function resetSale() {
    setCart([]); setCustomerName(""); setCustomerPhone(""); setMpesaPhone("");
    setCouponCode(""); setDiscount(0); setQuery(""); setResults([]);
    setPhase("idle"); setMessage(""); setLastOrderId("");
    searchRef.current?.focus();
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: product search */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, SKU, or brand…"
            autoFocus
            className="w-full"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="text-left rounded-xl border border-gray-100 bg-white p-3 hover:border-brand-300 hover:shadow-sm transition"
                >
                  <div className="aspect-square rounded-lg bg-gray-50 overflow-hidden mb-2">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300 text-xs">No img</div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-900 line-clamp-2">{p.name}</p>
                  {p.sku && <p className="text-[10px] text-gray-400">{p.sku}</p>}
                  <p className="text-xs font-semibold text-brand-600 mt-1">{fmt(p.salePrice ?? p.price)}</p>
                  <p className="text-[10px] text-gray-400">Stock: {p.stock}</p>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <p className="text-sm text-gray-400 text-center pt-8">No products found</p>
          ) : (
            <p className="text-sm text-gray-400 text-center pt-8">Type to search for a product</p>
          )}
        </div>
      </div>

      {/* Right: cart + payment */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-white overflow-hidden">
        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 text-center pt-8">Cart is empty</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{fmt(item.unitPrice)}</p>
                </div>
                <div className="flex items-center rounded border border-gray-200">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-2 py-1 text-gray-500 hover:text-gray-900 text-sm">−</button>
                  <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock} className="px-2 py-1 text-gray-500 hover:text-gray-900 text-sm disabled:opacity-40">+</button>
                </div>
                <span className="text-xs font-medium text-gray-800 w-16 text-right">{fmt(item.unitPrice * item.quantity)}</span>
              </div>
            ))
          )}
        </div>

        {/* Payment panel */}
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="flex justify-between text-sm font-semibold text-gray-900">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>

          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name (optional)" className="text-xs" />
          <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Customer phone (optional)" className="text-xs" />

          <div className="flex gap-2">
            <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon" className="text-xs flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
              className={`rounded-lg border py-2 text-xs font-medium transition ${paymentMethod === "CASH_ON_DELIVERY" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"}`}
            >
              💵 Cash
            </button>
            <button
              onClick={() => setPaymentMethod("MPESA")}
              disabled={!mpesaEnabled}
              className={`rounded-lg border py-2 text-xs font-medium transition ${paymentMethod === "MPESA" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600"} disabled:opacity-40`}
            >
              📱 M-Pesa
            </button>
          </div>

          {paymentMethod === "MPESA" && (
            <input type="tel" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="M-Pesa phone (07XX…)" className="text-xs" />
          )}

          {message && (
            <div className={`rounded-lg px-3 py-2 text-xs ${
              phase === "success" ? "bg-brand-50 text-brand-700" :
              phase === "error" ? "bg-danger-50 text-danger-600" :
              phase === "mpesa_waiting" ? "bg-amber-50 text-amber-700" :
              "bg-gray-50 text-gray-600"
            }`}>
              {phase === "mpesa_waiting" && <span className="mr-1 animate-pulse">⏳</span>}
              {message}
            </div>
          )}

          {(phase === "idle" || phase === "error") && (
            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0}
              className="btn-primary w-full justify-center py-2.5"
            >
              {paymentMethod === "MPESA" ? "📱 Charge via M-Pesa" : "💵 Collect Cash & Complete"}
            </button>
          )}

          {phase === "placing" && (
            <div className="text-center text-sm text-gray-500 py-2 animate-pulse">Processing…</div>
          )}

          {phase === "mpesa_waiting" && (
            <button onClick={() => { clearInterval(pollTimer.current); setPhase("error"); setMessage("Cancelled. Use cash or try again."); }} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
              Cancel M-Pesa wait
            </button>
          )}

          {phase === "success" && (
            <button onClick={resetSale} className="btn-primary w-full justify-center py-2.5 bg-green-600 hover:bg-green-700">
              ✓ New sale
            </button>
          )}
        </div>
      </div>
    </div>
  );
}