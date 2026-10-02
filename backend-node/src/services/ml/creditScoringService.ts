import type { Request } from "express";
import { prisma } from "@/config/database";
import { inferenceClient } from "./inferenceClient";
import { cacheManager } from "@/services/cache/cacheManager";
import { logger } from "@/config/logger";

export class CreditScoringService {
  async scoreLoan(
    tenantId: number,
    loanData: {
      amtIncomeTotal: number;
      amtCredit: number;
      amtAnnuity: number;
      amtGoodsPrice: number;
      daysBirth: number;
      daysEmployed: number;
      cntChildren: number;
      cntFamMembers: number;
    },
  ) {
    const cacheKey = `ml:${tenantId}:score:${JSON.stringify(loanData)}`;
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch { /* ignore */ }
    }
    const prediction = await inferenceClient.predict({
      amt_income_total: loanData.amtIncomeTotal,
      amt_credit: loanData.amtCredit,
      amt_annuity: loanData.amtAnnuity,
      amt_goods_price: loanData.amtGoodsPrice,
      days_birth: loanData.daysBirth,
      days_employed: loanData.daysEmployed,
      cnt_children: loanData.cntChildren,
      cnt_fam_members: loanData.cntFamMembers,
    });
    await cacheManager.set(cacheKey, JSON.stringify(prediction), 3600);
    return prediction;
  }

  async createScoredLoanApplication(req: Request, tenantId: number, userId: string, loanData: Record<string, number>) {
    const scoring = await this.scoreLoan(tenantId, {
      amtIncomeTotal: loanData.amtIncomeTotal,
      amtCredit: loanData.amtCredit,
      amtAnnuity: loanData.amtAnnuity,
      amtGoodsPrice: loanData.amtGoodsPrice,
      daysBirth: loanData.daysBirth,
      daysEmployed: loanData.daysEmployed,
      cntChildren: loanData.cntChildren,
      cntFamMembers: loanData.cntFamMembers,
    });

    const loanApp = await prisma.loanApplication.create({
      data: {
        tenantId,
        userId,
        status: "scored" as unknown as never,
        requestedAmount: loanData.amtCredit,
        tenureMonths: loanData.tenureMonths ?? 12,
        purpose: (loanData.purpose as unknown as never) ?? "PERSONAL",
        riskScore: scoring.credit_score ? Math.round((1 - scoring.default_probability) * 100) : undefined,
        riskLevel: scoring.risk_band?.toUpperCase() as unknown as never,
        defaultProbability: scoring.default_probability,
        modelVersion: scoring.model_version,
        shapValues: scoring.shap_summary as unknown as never,
        featureSnapshot: loanData as unknown as never,
        mlDecision: scoring.decision,
        creditScore: scoring.credit_score,
      } as never,
    });

    // audit
    try {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "loan.create_and_score",
          metadata: { scoring } as unknown as never,
          ip: req.ip ?? "unknown",
          userAgent: req.get("user-agent") ?? "unknown",
        },
      });
    } catch (e) {
      logger.warn({ err: e }, "audit log failed");
    }

    return loanApp;
  }
}

export const creditScoringService = new CreditScoringService();
