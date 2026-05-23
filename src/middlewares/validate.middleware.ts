import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

/**
 * Middleware factory for Zod schema validation
 * Validates req.body by default, can also validate query and params
 */
export const validate = (
  schema: ZodSchema,
  target: 'body' | 'query' | 'params' = 'body',
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      sendError(res, 'Dữ liệu đầu vào không hợp lệ', 422, errors);
      return;
    }

    // Replace with parsed (and potentially transformed) data
    req[target] = result.data;
    next();
  };
};
