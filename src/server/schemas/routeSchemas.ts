// Zod Schemas for Multi-Modal Route Queries and Seat Lookups
// Enforces route parameter validation, ISO date formats, and transport filter rules.

import { z } from 'zod';

/**
 * Route Search Query Parameters Schema
 */
export const searchRoutesQuerySchema = z.object({
  from: z.string({ message: 'Kalkış noktası gereklidir.' }).trim().min(2, 'Kalkış noktası en az 2 karakter olmalıdır.'),
  to: z.string({ message: 'Varış noktası gereklidir.' }).trim().min(2, 'Varış noktası en az 2 karakter olmalıdır.'),
  date: z
    .string({ message: 'Tarih gereklidir.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-MM-DD formatında olmalıdır.'),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dönüş tarihi YYYY-MM-DD formatında olmalıdır.')
    .optional(),
  transportType: z.enum(['otobus', 'ucak', 'tren', 'feribot', 'all']).default('all'),
  passengerCount: z.coerce.number().int().min(1, 'En az 1 yolcu seçilmelidir.').max(10, 'En fazla 10 yolcu seçilebilir.').default(1),
  sortBy: z.enum(['cheapest', 'fastest', 'earliest', 'rating']).default('earliest'),
  maxPrice: z.coerce.number().positive('Maksimum fiyat pozitif olmalıdır.').optional(),
  seatType: z.enum(['all', 'single', 'window', 'aisle', 'table', 'business', 'exit_row']).default('all'),
});

export type SearchRoutesQuery = z.infer<typeof searchRoutesQuerySchema>;

/**
 * Route ID Parameter Schema
 */
export const routeIdParamSchema = z.object({
  id: z.string({ message: 'Sefer ID parametresi gereklidir.' }).trim().min(1, 'Sefer ID boş olamaz.'),
});

export type RouteIdParam = z.infer<typeof routeIdParamSchema>;

/**
 * Seats Query Schema
 */
export const seatsQuerySchema = z.object({
  gender: z.enum(['male', 'female', 'none']).optional(),
  cabinClass: z.enum(['economy', 'business', 'vip', 'all']).optional().default('all'),
});

export type SeatsQuery = z.infer<typeof seatsQuerySchema>;
