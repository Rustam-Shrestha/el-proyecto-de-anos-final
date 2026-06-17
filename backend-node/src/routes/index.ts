import { Router } from 'express';
import userRouter from '@/routes/userRoutes';
import authRouter from '@/routes/authRoutes';
import kycRouter from '@/routes/kycRoutes';
import adminRouter from '@/routes/adminRoutes';
import loanRouter from '@/routes/loanRoutes';
import employmentRouter from '@/routes/employmentRoutes';

export const apiRouter = Router();

// Health check (public)
apiRouter.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount sub-routers
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/kyc', kycRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/loan', loanRouter);
apiRouter.use('/employment', employmentRouter);
// apiRouter.use('/audit', auditRoutes);   // TODO: implement audit routes

export default apiRouter;
