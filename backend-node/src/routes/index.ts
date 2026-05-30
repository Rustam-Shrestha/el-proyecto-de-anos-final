import { Router } from 'express';
import userRouter from '@/routes/userRoutes';
import authRouter from '@/routes/authRoutes';
import kycRouter from '@/routes/kycRoutes';
import documentRouter from '@/routes/documentRoutes';
import adminRouter from '@/routes/adminRoutes';

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
apiRouter.use('/documents', documentRouter);
apiRouter.use('/admin', adminRouter);
// apiRouter.use('/audit', auditRoutes);   // TODO: implement audit routes

export default apiRouter;
