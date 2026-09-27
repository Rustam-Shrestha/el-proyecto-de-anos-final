import bcryptjs from "bcryptjs";
import { prisma } from "../src/config/database";

const SUPERADMIN_EMAIL = "santosh.787402@smc.tu.edu.np";
const SUPERADMIN_PASSWORD = "SuperAdmin@123!";

async function main() {
  const sc = await (prisma as any).supercontroller.upsert({
    where: { email: SUPERADMIN_EMAIL },
    update: {},
    create: {
      email: SUPERADMIN_EMAIL,
      passwordHash: await bcryptjs.hash(SUPERADMIN_PASSWORD, 12),
      fullName: "FinGuard Super Admin",
      status: "active",
    },
  });
  console.log("supercontroller row:", JSON.stringify({ id: sc.id, email: sc.email, status: sc.status }));

  const verify = await bcryptjs.compare(
    SUPERADMIN_PASSWORD,
    (await (prisma as any).supercontroller.findUnique({ where: { email: SUPERADMIN_EMAIL } })).passwordHash,
  );
  console.log("password verifies:", verify);

  await prisma.$disconnect();
}

main();
