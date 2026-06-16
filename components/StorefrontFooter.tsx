export default function StorefrontFooter({ tenantName, phone, email }: {
  tenantName: string;
  phone?: string | null;
  email?: string | null;
}) {
  return (
    <footer className="border-t border-gray-100 bg-white mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {tenantName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {phone && <span>{phone}</span>}
            {email && <span>{email}</span>}
          </div>
        </div>
      </div>
    </footer>
  );
}
