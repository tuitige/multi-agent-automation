import { Request, Response } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response
): void => {
  console.error('Error:', error);

  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};