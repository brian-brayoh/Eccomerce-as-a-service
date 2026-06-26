import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Safaricom calls this URL after the customer completes (or
 * cancels/times out on) the STK Push prompt on their phone.
 *
 * IMPORTANT: This endpoint must always respond with HTTP 200 and
 * `{ ResultCode: 0 }`-shaped JSON, even on our own internal errors —
 * Daraja interprets anything else as "retry the callback later" and
 * will keep hammering this URL. We log failures but still ack receipt.
 *
 * The payload shape (when successful):
 * {
 *   Body: {
 *     stkCallback: {
 *       MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc,
 *       CallbackMetadata: { Item: [
 *         { Name: "Amount", Value: 1 },
 *         { Name: "MpesaReceiptNumber", Value: "NLJ7RT61SV" },
 *         { Name: "TransactionDate", Value: 20191219102115 },
 *         { Name: "PhoneNumber", Value: 254708374149 }
 *       ]}
 *     }
 *   }
 * }
 *
 * ResultCode 0 = success. Anything else = customer cancelled, timed
 * out, insufficient funds, etc. — ResultDesc has the human-readable reason.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const callback = body?.Body?.stkCallback;

    if (!callback?.CheckoutRequestID) {
      console.error("M-Pesa callback missing CheckoutRequestID:", JSON.stringify(body));
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;

    const payment = await prisma.payment.findFirst({
      where: { providerRef: checkoutRequestId },
      include: { order: true },
    });

    if (!payment) {
      console.error("M-Pesa callback: no payment found for CheckoutRequestID", checkoutRequestId);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Avoid double-processing if Safaricom retries the same callback
    if (payment.status !== "PENDING") {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Already processed" });
    }

    if (resultCode === 0) {
      // Success — extract the M-Pesa receipt number from the metadata items
      const items: { Name: string; Value: string | number }[] = callback.CallbackMetadata?.Item ?? [];
      const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value;

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESS",
            mpesaReceipt: receipt ? String(receipt) : null,
          },
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "PAID" },
        }),
      ]);
    } else {
      // Customer cancelled, timed out, or had insufficient funds.
      // Order stays PENDING so they can retry payment or switch to
      // Cash on Delivery — we don't auto-cancel the order here.
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
