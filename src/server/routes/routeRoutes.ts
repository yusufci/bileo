// Multi-Modal Routes & Seat Matrix REST Routes for Bileo Platform
// Enforces Zod query/param validation for multi-modal travel search and interactive seating layouts.

import { Router } from 'express';
import { RouteController } from '../controllers/routeController';
import { validateRequest } from '../middleware/validateRequest';
import { searchRoutesQuerySchema, routeIdParamSchema, seatsQuerySchema } from '../schemas/routeSchemas';

export const routeRouter = Router();

// 1. Search Multi-Modal Routes (Bus, Flight, Train, Ferry)
routeRouter.get(
  '/',
  validateRequest({ query: searchRoutesQuerySchema }),
  RouteController.searchRoutes
);

// 2. Real-Time Telemetry & Scraper Health
routeRouter.get('/telemetry', RouteController.getLiveTelemetry);

// 3. Live Turkish Airspace ADS-B Feed
routeRouter.get('/airspace', RouteController.getLiveAirspace);

// 4. Get Single Route Details by ID
routeRouter.get(
  '/:id',
  validateRequest({ params: routeIdParamSchema }),
  RouteController.getRouteById
);

// 5. Get Interactive Seat Layout & Occupancy Matrix for Route
routeRouter.get(
  '/:id/seats',
  validateRequest({ params: routeIdParamSchema, query: seatsQuerySchema }),
  RouteController.getRouteSeats
);

