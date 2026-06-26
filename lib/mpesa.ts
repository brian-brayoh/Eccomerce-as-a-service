/**
 * M-Pesa Daraja API client — STK Push (Lipa Na M-Pesa Online).
 *
 * Each tenant has their own Daraja credentials (shortcode, consumer
 * key/secret, passkey) stored on the Tenant row, since each business
 * has its own till/paybill number. This client takes those
 * credentials as parameters rather than reading from a single global
 * env var — that's the multi-tenant-from-day-one principle applied
 * to payments too.
 */

type TenantMpesaConfig = {
  mpesaShortcode: string;
  mpesaConsumerKey: string;
  mpesaConsumerSecret: string;
  mpesaPasskey: string;
  mpesaEnvironment: string; // "sandbox" | "production"
};

function baseUrl(environment: string) {
  return environment === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

/**
 * Fetches an OAuth access token from Daraja. Tokens expire after
 * ~1 hour — for simplicity we fetch a fresh one per request rather
 * than caching, since STK Push requests are infrequent enough that
 * the extra round-trip doesn't matter in practice.
 */
async function getAccessToken(config: TenantMpesaConfig): Promise<string> {
  const credentials = Buffer.from(`${config.mpesaConsumerKey}:${config.mpesaConsumerSecret}`).toString("base64");

  const res = await fetch(`${baseUrl(config.mpesaEnvironment)}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!res.ok) {
    throw new Error(`Daraja auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token;
}

function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

/**
 * Normalizes a Kenyan phone number into the 2547XXXXXXXX format
 * Daraja requires. Accepts 07XX, +2547XX, 2547XX, or 7XX inputs.
 */
export function normalizeMpesaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

export type StkPushResult = {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  responseDescription?: string;
  error?: string;
};

/**
 * Initiates an STK Push — sends a payment prompt to the customer's
 * phone. Returns a CheckoutRequestID which must be stored against
 * the Payment row so the callback can later match it back up.
 */
export async function initiateStkPush({
  config,
  phone,
  amount,
  accountReference,
  description,
  callbackUrl,
}: {
  config: TenantMpesaConfig;
  phone: string;
  amount: number;
  accountReference: string; // shows on customer's M-Pesa statement, e.g. order ID
  description: string;
  callbackUrl: string;
}): Promise<StkPushResult> {
  try {
    const accessToken = await getAccessToken(config);
    const ts = timestamp();
    const password = Buffer.from(`${config.mpesaShortcode}${config.mpesaPasskey}${ts}`).toString("base64");
    const normalizedPhone = normalizeMpesaPhone(phone);

    const res = await fetch(`${baseUrl(config.mpesaEnvironment)}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: config.mpesaShortcode,
        Password: password,
        Timestamp: ts,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount), // M-Pesa sandbox rejects decimals
        PartyA: normalizedPhone,
        PartyB: config.mpesaShortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrl,
        AccountReference: accountReference.slice(0, 12), // Daraja limits this field
        TransactionDesc: description.slice(0, 13),
      }),
    });

    const data = await res.json();

    if (data.ResponseCode === "0") {
      return {
        success: true,
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
        responseDescription: data.ResponseDescription,
      };
    }

    return { success: false, error: data.errorMessage ?? data.ResponseDescription ?? "STK Push failed" };
  } catch (err: any) {
    return { success: false, error: err.message ?? "STK Push request failed" };
  }
}
