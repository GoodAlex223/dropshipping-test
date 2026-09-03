/**
 * Delete the seeded test-customer accounts.
 *
 * G17 finding F1 published these accounts' passwords in the public repository,
 * and the seed created them in production (documented SEED_ALLOW_REMOTE=1 runs,
 * 2026-07-31 and 2026-08-04). Rotating them is one option; removing them is the
 * other, chosen by the owner 2026-09-02 — they are fixtures with no business
 * value in a live shop.
 *
 * What goes with each account (Prisma referential actions, verified against
 * schema.prisma): Account, Session, Cart, Address and **Review** rows cascade
 * and are deleted. Order rows do NOT — `Order.userId` is optional, so orders
 * survive with userId set to null, i.e. they become guest orders and all
 * revenue history is preserved.
 *
 * DRY RUN BY DEFAULT. Nothing is deleted unless CONFIRM_DELETE=yes is set.
 *
 *   ROTATE-STYLE USAGE:
 *     npm run db:delete-test-accounts                  # report only
 *     CONFIRM_DELETE=yes npm run db:delete-test-accounts
 *
 * The address list is hard-coded on purpose: this script can only ever touch
 * these four seeded fixtures, never a real customer, whatever is passed to it.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** The seeded fixtures, and nothing else. Never parameterised. */
const TEST_EMAILS = [
  "customer@example.com",
  "sarah.wilson@example.com",
  "mike.johnson@example.com",
  "emily.chen@example.com",
];

async function main() {
  const confirmed = process.env.CONFIRM_DELETE === "yes";

  const host = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").hostname;
    } catch {
      return "(unparsable DATABASE_URL)";
    }
  })();

  console.log(`\nDatabase host: ${host}`);
  console.log(confirmed ? "Mode: DELETE (confirmed)\n" : "Mode: DRY RUN — nothing will change\n");

  const users = await prisma.user.findMany({
    where: { email: { in: TEST_EMAILS } },
    select: {
      id: true,
      email: true,
      role: true,
      _count: { select: { reviews: true, orders: true, addresses: true } },
    },
  });

  if (users.length === 0) {
    console.log("No seeded test accounts found — nothing to do.\n");
    return;
  }

  // A seeded fixture must never have been promoted to ADMIN; if one was, stop
  // rather than quietly deleting an administrator.
  const admins = users.filter((u) => u.role === "ADMIN");
  if (admins.length > 0) {
    throw new Error(
      `Refusing to run: ${admins.map((a) => a.email).join(", ")} has role ADMIN. ` +
        "Investigate before deleting anything."
    );
  }

  for (const u of users) {
    console.log(`  ${u.email}`);
    console.log(`      reviews deleted:      ${u._count.reviews}`);
    console.log(`      addresses deleted:    ${u._count.addresses}`);
    console.log(`      orders kept as guest: ${u._count.orders}`);
  }

  const totalReviews = users.reduce((n, u) => n + u._count.reviews, 0);
  const totalOrders = users.reduce((n, u) => n + u._count.orders, 0);
  console.log(
    `\n  ${users.length} account(s): ${totalReviews} review(s) will be deleted, ` +
      `${totalOrders} order(s) will be kept and detached.`
  );

  if (!confirmed) {
    console.log("\nDry run only. Re-run with CONFIRM_DELETE=yes to apply.\n");
    return;
  }

  const { count } = await prisma.user.deleteMany({
    where: { email: { in: users.map((u) => u.email) } },
  });
  console.log(`\nDeleted ${count} account(s). Orders were detached, not removed.\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(`\n${e instanceof Error ? e.message : e}\n`);
    await prisma.$disconnect();
    process.exit(1);
  });
