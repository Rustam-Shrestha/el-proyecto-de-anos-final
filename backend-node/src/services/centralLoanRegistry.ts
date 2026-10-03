import { prisma } from "@/config/database";

// Centralized registry — queries loans across all tenants for same natural person
// Uses citizenship PAN or email linkage; low complexity high value.
export const centralRegistry = {
  async getExposureByUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user) return { totalOutstanding: 0, totalMonthlyEMI: 0, activeCount: 0, loans: [] as any[] };
    // find all accounts for same email or citizenship
    const kyc = await prisma.kycApplication.findFirst({ where: { userId, status: "APPROVED" }, orderBy: { createdAt: "desc" } }).catch(()=> null) as any;
    const pan = kyc?.confirmedCitizenshipNumber || kyc?.ocrCitizenshipNumber;
    let userIds = [userId];
    if (pan) {
      const others = await prisma.kycApplication.findMany({ where: { confirmedCitizenshipNumber: pan, status: "APPROVED" }, select: { userId: true } }).catch(()=>[] as any);
      userIds = Array.from(new Set([userId, ...others.map((o:any)=>o.userId)]));
    }
    // also include same email prefix? already single user row, so use userIds
    const accounts = await prisma.loanAccount.findMany({ where: { userId: { in: userIds }, isActive: true, status: "ACTIVE" } }).catch(()=>[] as any[]);
    const loans = await prisma.loanApplication.findMany({ where: { userId: { in: userIds }, status: { in: ["APPROVED","SUBMITTED","UNDER_REVIEW"] } } }).catch(()=>[] as any[]);
    const totalOutstanding = accounts.reduce((s:number,a:any)=> s+ Number(a.outstandingBalance||0), 0);
    const totalMonthlyEMI = accounts.reduce((s:number,a:any)=> s+ Number(a.monthlyEMI||0), 0);
    return { totalOutstanding, totalMonthlyEMI, activeCount: accounts.length, loans, pan };
  },
  async getExposureByPan(pan: string) {
    const kycs = await prisma.kycApplication.findMany({ where: { confirmedCitizenshipNumber: pan } }) as any[];
    const userIds = kycs.map(k=>k.userId);
    if (!userIds.length) return { totalOutstanding:0, totalMonthlyEMI:0, activeCount:0 };
    const accounts = await prisma.loanAccount.findMany({ where: { userId: { in: userIds }, isActive: true } }) as any[];
    const totalOutstanding = accounts.reduce((s:number,a:any)=> s+ Number(a.outstandingBalance||0), 0);
    const totalMonthlyEMI = accounts.reduce((s:number,a:any)=> s+ Number(a.monthlyEMI||0), 0);
    return { totalOutstanding, totalMonthlyEMI, activeCount: accounts.length, accounts };
  }
};
