import axios from "axios";
import { env } from "@/config/env";
import { logger } from "@/config/logger";

interface PredictionRequest {
  amt_income_total: number;
  amt_credit: number;
  amt_annuity: number;
  amt_goods_price: number;
  days_birth: number;
  days_employed: number;
  cnt_children: number;
  cnt_fam_members: number;
}

interface PredictionResponse {
  model_version: string;
  default_probability: number;
  credit_score: number;
  risk_band: "Low" | "Medium" | "High";
  decision: "Approve" | "Decline";
  threshold: number;
  shap_summary: Record<string, number>;
  timestamp: string;
}

export class InferenceClient {
  private get baseUrl() {
    return (env as unknown as { ML_SERVICE_URL?: string }).ML_SERVICE_URL || env.FASTAPI_URL;
  }
  private timeout = 30000;

  async predict(data: PredictionRequest): Promise<PredictionResponse> {
    try {
      const res = await axios.post<PredictionResponse>(`${this.baseUrl}/api/v1/finguard/predict`, data, { timeout: this.timeout });
      return res.data;
    } catch (error) {
      logger.error({ err: error }, "ML inference error");
      throw new Error("Credit scoring service unavailable");
    }
  }

  async health(): Promise<boolean> {
    try {
      const res = await axios.get(`${this.baseUrl}/api/v1/finguard/health`, { timeout: 5000 });
      return !!res.data;
    } catch {
      try {
        const res2 = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
        return res2.data?.status === "healthy" || !!res2.data;
      } catch {
        return false;
      }
    }
  }
}

export const inferenceClient = new InferenceClient();
