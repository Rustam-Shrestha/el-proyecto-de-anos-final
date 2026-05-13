import { Router, Request, Response } from "express";
import axios from "axios";
import multer from "multer";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { env } from "@config/env";
import { logger } from "@config/logger";
import type { Express } from "express";

export const kycRoutes = Router();

// FastAPI KYC backend URL
const FASTAPI_URL = env.FASTAPI_URL || "http://localhost:8080";

// Ensure uploads dir exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "kyc");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => cb(null, UPLOAD_DIR),
  filename: (_req: Request, file: Express.Multer.File, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

/**
 * POST /kyc/upload - accept multipart from frontend, forward to FastAPI as multipart
 */
kycRoutes.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;
  try {
    if (!file) {
      return res.status(400).json({ success: false, message: "Missing file" });
    }

    const fastApiUrl = `${FASTAPI_URL}/api/v1/kyc/upload`;

    const form = new FormData();
    // forward form fields
    if (req.body.user_id) form.append("user_id", req.body.user_id);
    if (req.body.document_type) form.append("document_type", req.body.document_type);

    // attach file stream
    const fileStream = fs.createReadStream(file.path);
    form.append("file", fileStream, { filename: file.originalname });

    const headers = Object.assign({}, form.getHeaders());

    const response = await axios.post(fastApiUrl, form as any, {
      headers,
      maxBodyLength: Infinity,
      timeout: 60000,
    });

    // cleanup temp file
    fs.unlink(file.path, () => {});

    return res.status(response.status).json(response.data);
  } catch (error: unknown) {
    // if file exists, attempt cleanup
    if (file && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch {}
    }

    if (axios.isAxiosError(error)) {
      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        logger.error({ err: error, fastApiUrl: FASTAPI_URL }, "FastAPI service unavailable");
        return res.status(503).json({
          success: false,
          message: `FastAPI service unavailable at ${FASTAPI_URL}. Start the FastAPI service and retry.`,
        });
      }

      const status = error.response?.status || 500;
      const message = error.response?.data?.message || "Document upload failed";
      logger.error({ err: error }, "KYC upload failed");
      return res.status(status).json({ success: false, message });
    }

    logger.error({ err: error }, "Unexpected error during KYC upload");
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * POST /kyc/verify - Forward face verification to FastAPI
 */
kycRoutes.post("/verify", async (req: Request, res: Response) => {
  try {
    const fastApiUrl = `${FASTAPI_URL}/api/v1/kyc/verify`;
    
    const response = await axios.post(fastApiUrl, req.body, {
      headers: {
        "Content-Type": "application/json",
        ...req.headers,
      },
      timeout: 30000,
    });

    return res.status(response.status).json(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        logger.error(
          { err: error, fastApiUrl: FASTAPI_URL },
          "FastAPI service unavailable"
        );
        return res.status(503).json({
          success: false,
          message: `FastAPI service unavailable at ${FASTAPI_URL}. Make sure the FastAPI backend is running.`,
        });
      }

      const status = error.response?.status || 500;
      const message = error.response?.data?.message || "Face verification failed";
      logger.error({ err: error }, "KYC verify failed");
      return res.status(status).json({
        success: false,
        message,
      });
    }
    
    logger.error({ err: error }, "Unexpected error during KYC verify");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * GET /kyc/status/:kycApplicationId - Retrieve KYC status from FastAPI
 */
kycRoutes.get("/status/:kycApplicationId", async (req: Request, res: Response) => {
  try {
    const { kycApplicationId } = req.params;
    const fastApiUrl = `${FASTAPI_URL}/api/v1/kyc/status/${kycApplicationId}`;
    
    const response = await axios.get(fastApiUrl, {
      headers: {
        ...req.headers,
      },
      timeout: 30000,
    });

    return res.status(response.status).json(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        logger.error(
          { err: error, fastApiUrl: FASTAPI_URL },
          "FastAPI service unavailable"
        );
        return res.status(503).json({
          success: false,
          message: `FastAPI service unavailable at ${FASTAPI_URL}. Make sure the FastAPI backend is running.`,
        });
      }

      const status = error.response?.status || 500;
      const message = error.response?.data?.message || "Failed to retrieve KYC status";
      logger.error({ err: error }, "KYC status retrieval failed");
      return res.status(status).json({
        success: false,
        message,
      });
    }
    
    logger.error({ err: error }, "Unexpected error during KYC status retrieval");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
