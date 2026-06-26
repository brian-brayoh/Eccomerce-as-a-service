import Link from "next/link";

type Props = {
  planStatus: string;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
};

export default function SubscriptionAlert({ planStatus, trialEndsAt, subscriptionEndsAt }: Props) {
  const now = new Date();
  const expiryDate = subscriptionEndsAt ?? trialEndsAt;

  if (!expiryDate) return null;

  const daysLeft = Math.ceil((new Date(expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Don't show if more than 14 days left
  if (daysLeft > 14) return null;

  const isExpired = daysLeft <= 0;
  const isTrial = planStatus === "TRIALING";

  if (isExpired) {
    return (
      <div className="bg-red-600 px-6 py-2 text-xs text-white flex items-center justify-between">
        <span>
          🚨 Your {isTrial ? "trial" : "subscription"} has expired. Renew now to avoid losing access.
        </span>
        <Link href="/dashboard/subscribe" className="ml-4 rounded-lg bg-white px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition flex-shrink-0">
          Renew now
        </Link>
      </div>
    );
  }

  if (daysLeft <= 3) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-xs text-red-700 flex items-center justify-between">
        <span>
          ⚠️ Your {isTrial ? "trial" : "subscription"} expires in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>.
          Renew to keep your store running.
        </span>
        <Link href="/dashboard/subscribe" className="ml-4 rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition flex-shrink-0">
          Renew
        </Link>
      </div>
    );
  }

  if (daysLeft <= 7) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800 flex items-center justify-between">
        <span>
          ⏰ Your {isTrial ? "trial" : "subscription"} expires in <strong>{daysLeft} days</strong> on{" "}
          {new Date(expiryDate).toLocaleDateString("en-KE", { day: "numeric", month: "long" })}.
        </span>
        <Link href="/dashboard/subscribe" className="ml-4 rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition flex-shrink-0">
          Renew
        </Link>
      </div>
    );
  }

  // 8–14 days: subtle blue notice
  return (
    <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 text-xs text-blue-700 flex items-center justify-between">
      <span>
        Your {isTrial ? "free trial" : "subscription"} expires in <strong>{daysLeft} days</strong>.
      </span>
      <Link href="/dashboard/subscribe" className="ml-4 text-blue-600 font-medium hover:underline flex-shrink-0">
        View plans →
      </Link>
    </div>
  );
}
