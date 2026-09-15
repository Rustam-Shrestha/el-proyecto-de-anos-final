import axios from 'axios';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

export interface FinguardInput {
  amt_income_total: number;
  amt_credit: number;
  amt_annuity?: number;
  amt_goods_price?: number;
  days_birth: number;
  days_employed: number;
  cnt_children?: number;
  cnt_fam_members?: number;
  occupation_type?: string;
  organization_type?: string;
}

export interface FinguardResult {
  model_version: string;
  default_probability: number;
  credit_score: number;
  risk_band: string;
  decision: string;
  threshold: number;
  shap_summary: Record<string, number>;
  features_used: string[];
  timestamp: string;
}

export const finguardProxyService = {
  async evaluate(input: FinguardInput): Promise<FinguardResult | null> {
    const base = env.ML_SERVICE_URL || env.FASTAPI_URL;
    const url = `${base.replace(/\/$/, '')}/api/v1/finguard/predict`;
    try {
      const { data } = await axios.post<FinguardResult>(url, {
        amt_income_total: input.amt_income_total,
        amt_credit: input.amt_credit,
        amt_annuity: input.amt_annuity ?? 0,
        amt_goods_price: input.amt_goods_price ?? 0,
        days_birth: input.days_birth,
        days_employed: input.days_employed,
        cnt_children: input.cnt_children ?? 0,
        cnt_fam_members: input.cnt_fam_members ?? 1,
        occupation_type: input.occupation_type,
        organization_type: input.organization_type,
      }, { timeout: 5000 });
      return data;
    } catch (e) {
      logger.warn({ err: e, url }, 'FinGuard proxy failed, fallback to heuristic');
      return null;
    }
  }
};
