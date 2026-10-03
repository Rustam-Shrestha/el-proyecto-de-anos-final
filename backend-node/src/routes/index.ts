import { Router } from 'express';
import userRouter from '@/routes/userRoutes';
import authRouter from '@/routes/authRoutes';
import kycRouter from '@/routes/kycRoutes';
import adminRouter from '@/routes/adminRoutes';
import loanRouter from '@/routes/loanRoutes';
import employmentRouter from '@/routes/employmentRoutes';
import portfolioRouter from '@/routes/portfolioRoutes';
import uploadRouter from '@/routes/uploadRoutes';
import transactionRouter from '@/routes/transactionRoutes';
import financialRouter from '@/routes/financialRoutes';
import chatbotRouter from '@/routes/chatbotRoutes';
import loanAssessmentRouter from '@/routes/loanAssessmentRoutes';
import notificationRouter from '@/routes/notificationRoutes';

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
apiRouter.use('/portfolio', portfolioRouter);

// FinGuard Financial Analysis routes
apiRouter.use('/uploads', uploadRouter);
apiRouter.use('/transactions', transactionRouter);
apiRouter.use('/financial', financialRouter);
apiRouter.use('/chat', chatbotRouter);
apiRouter.use('/loan-assessment', loanAssessmentRouter);
apiRouter.use('/notifications', notificationRouter);

// apiRouter.use('/audit', auditRoutes);   // TODO: implement audit routes

export default apiRouter;
