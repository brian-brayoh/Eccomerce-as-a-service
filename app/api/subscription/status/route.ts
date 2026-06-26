import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) return NextResponse.json({ active: false });

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return NextResponse.json({ active: false });

  const now = new Date();
  const expiryDate = (tenant as any).subscriptionEndsAt;
  const isActive = tenant.planStatus === "ACTIVE" && expiryDate && new Date(expiryDate) > now;

  return NextResponse.json({ active: isActive, planStatus: tenant.planStatus });
}
