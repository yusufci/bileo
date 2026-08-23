// Health Check & Infrastructure Readiness Controller for Bileo Platform
// Provides liveness probes, readiness probes, and database connection checks.

import { Request, Response, NextFunction } from 'express';
import { DatabaseManager } from '../db';

export class HealthController {
  /**
   * Basic liveness probe (HTTP 200 OK)
   */
  public static async healthCheck(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'ok',
      service: 'bileo-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  }

  /**
   * Readiness probe verifying database connectivity & transaction readiness
   */
  public static async readinessCheck(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = DatabaseManager.getInstance().getService();
      const health = await db.healthCheck();

      if (health.status === 'healthy') {
        res.status(200).json({
          status: 'healthy',
          database: {
            mode: health.mode,
            status: health.status,
            latencyMs: health.latencyMs,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          status: 'unhealthy',
          database: {
            mode: health.mode,
            status: health.status,
            error: health.error,
          },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      next(error);
    }
  }
}
