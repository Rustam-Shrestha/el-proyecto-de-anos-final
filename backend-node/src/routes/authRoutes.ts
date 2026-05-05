import { NextFunction, Request, Response, Router } from "express";
import { loginController } from "@controllers/authController";
import { validateRequest } from "@middleware/requestValidation";
import { loginSchema } from "@routes/schemas";
import passport from "passport";
import { isOAuthEnabled } from "@middleware/oauth2";
import { requireAuth } from "@middleware/auth";

export const authRoutes = Router();

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login with email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Auth payload
 */
authRoutes.post("/login", validateRequest(loginSchema), loginController);

authRoutes.get("/me", requireAuth, (req: Request, res: Response) => {
	return res.json({
		success: true,
		data: req.user
	});
});

authRoutes.get("/oauth2/authorize", (req: Request, res: Response, next: NextFunction) => {
	if (!isOAuthEnabled) {
		return res.status(501).json({ success: false, message: "OAuth2 is not configured" });
	}
	return passport.authenticate("oauth2")(req, res, next);
});

authRoutes.get("/oauth2/callback", (req: Request, res: Response, next: NextFunction) => {
	if (!isOAuthEnabled) {
		return res.status(501).json({ success: false, message: "OAuth2 is not configured" });
	}

	return passport.authenticate("oauth2", { session: false }, () => {
		return res.json({ success: true, data: { message: "OAuth2 callback handled" } });
	})(req, res, next);
});
