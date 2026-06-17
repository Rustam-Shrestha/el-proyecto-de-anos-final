import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/requestValidation';
import { employmentSchema } from '@/routes/employmentSchemas';
import {
  saveEmployment,
  getEmployment,
} from '@/controllers/employmentController';

const employmentRouter = Router();

employmentRouter.post(
  '/',
  authenticate,
  validate(employmentSchema),
  saveEmployment
);

employmentRouter.get(
  '/',
  authenticate,
  getEmployment
);

export default employmentRouter;
