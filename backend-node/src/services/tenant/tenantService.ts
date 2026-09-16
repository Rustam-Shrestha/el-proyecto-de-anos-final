import { prisma } from "@/config/database";

export const tenantService = {
  async ensureDefault(): Promise<number> {
    let t = await prisma.tenant.findUnique({ where: { slug: "default" } });
    if (!t) t = await prisma.tenant.create({ data: { slug: "default", name: "Default Tenant", status: "active" } });
    return t.id;
  },
  async findBySlug(slug: string) {
    return prisma.tenant.findUnique({ where: { slug } });
  },
  async create(slug: string, name: string, domain?: string) {
    return prisma.tenant.create({ data: { slug, name, domain, status: "active" } });
  },
};
