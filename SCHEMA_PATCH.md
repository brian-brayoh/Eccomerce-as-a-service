# SCHEMA CHANGES — add these fields to the Tenant model in prisma/schema.prisma
# Find the Tenant model and add these lines after planStatus:

#   planStatus      TenantPlanStatus @default(TRIALING)
#   trialEndsAt     DateTime?                              // ← ADD
#   subscriptionEndsAt DateTime?                           // ← ADD
#   subscriptionAlertSentAt DateTime?                      // ← ADD (tracks when we last sent an alert)

# After adding, run:
#   npm run db:push
