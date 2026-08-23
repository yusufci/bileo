// Route Search, Route Details & Interactive Seat Layout Controller for Bileo
// Implements multi-modal route filtering, carrier metadata join, sorting, and dynamic seat map lookups.

import { Request, Response, NextFunction } from 'express';
import { DatabaseManager } from '../db';
import { SearchRoutesQuery, RouteIdParam } from '../schemas/routeSchemas';

export class RouteController {
  /**
   * Search multi-modal routes across bus, flight, train, and ferry networks.
   */
  public static async searchRoutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = DatabaseManager.getInstance().getService();
      const query = req.query as unknown as SearchRoutesQuery;

      const fromCity = (query.from || '').trim().toLowerCase();
      const toCity = (query.to || '').trim().toLowerCase();
      const transportType = query.transportType || 'all';
      const sortBy = query.sortBy || 'earliest';
      const maxPrice = query.maxPrice;

      // 1. Fetch routes matching origin and destination
      const routesRes = await db.query('SELECT * FROM routes WHERE is_active = $1', [true]);
      const carriersRes = await db.query('SELECT * FROM carriers WHERE is_active = $1', [true]);

      const carrierMap = new Map<string, any>();
      carriersRes.rows.forEach((c) => carrierMap.set(c.id, c));

      let matchedRoutes = routesRes.rows.filter((r) => {
        const originMatch =
          r.origin_city.toLowerCase().includes(fromCity) ||
          fromCity.includes(r.origin_city.toLowerCase());
        const destMatch =
          r.destination_city.toLowerCase().includes(toCity) ||
          toCity.includes(r.destination_city.toLowerCase());

        if (!originMatch || !destMatch) return false;

        if (transportType !== 'all' && r.transport_type !== transportType) {
          return false;
        }

        if (maxPrice !== undefined && Number(r.base_price) > maxPrice) {
          return false;
        }

        return true;
      });

      // 2. Fetch seats to calculate live available seat counts per route
      const seatsRes = await db.query('SELECT route_id, status FROM seats');
      const availabilityMap = new Map<string, { total: number; available: number }>();

      seatsRes.rows.forEach((s) => {
        const current = availabilityMap.get(s.route_id) || { total: 0, available: 0 };
        current.total += 1;
        if (s.status === 'available') {
          current.available += 1;
        }
        availabilityMap.set(s.route_id, current);
      });

      // 3. Format response objects with carrier metadata
      const formattedRoutes = matchedRoutes.map((r) => {
        const carrier = carrierMap.get(r.carrier_id) || {
          id: r.carrier_id,
          name: 'Bileo Partner',
          code: 'BL',
          rating: 4.5,
          review_count: 50,
          logo_url: null,
        };

        const seatStats = availabilityMap.get(r.id) || { total: 40, available: 25 };

        return {
          id: r.id,
          carrierId: r.carrier_id,
          carrierName: carrier.name,
          carrierCode: carrier.code,
          carrierLogo: carrier.logo_url,
          carrierRating: Number(carrier.rating),
          carrierReviewCount: carrier.review_count,
          transportType: r.transport_type,
          originCity: r.origin_city,
          originTerminal: r.origin_terminal,
          destinationCity: r.destination_city,
          destinationTerminal: r.destination_terminal,
          departureTime: r.departure_time,
          arrivalTime: r.arrival_time,
          durationMinutes: r.duration_minutes,
          basePrice: Number(r.base_price),
          originalPrice: r.original_price ? Number(r.original_price) : null,
          vehicleType: r.vehicle_type,
          seatLayoutType: r.seat_layout_type,
          serviceClass: r.service_class,
          gateOrPlatform: r.gate_or_platform,
          badge: r.badge,
          features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features || [],
          totalSeats: seatStats.total,
          availableSeats: seatStats.available,
        };
      });

      // 4. Apply sorting algorithm
      formattedRoutes.sort((a, b) => {
        switch (sortBy) {
          case 'cheapest':
            return a.basePrice - b.basePrice;
          case 'fastest':
            return a.durationMinutes - b.durationMinutes;
          case 'rating':
            return b.carrierRating - a.carrierRating;
          case 'earliest':
          default:
            return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
        }
      });

      res.status(200).json({
        success: true,
        count: formattedRoutes.length,
        routes: formattedRoutes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single route detail by ID with carrier metadata.
   */
  public static async getRouteById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = DatabaseManager.getInstance().getService();
      const { id } = req.params as unknown as RouteIdParam;

      const routeRes = await db.query('SELECT * FROM routes WHERE id = $1 AND is_active = $2', [id, true]);
      if (routeRes.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Belirtilen sefer bulunamadı.',
          code: 'ROUTE_NOT_FOUND',
        });
        return;
      }

      const route = routeRes.rows[0];
      const carrierRes = await db.query('SELECT * FROM carriers WHERE id = $1', [route.carrier_id]);
      const carrier = carrierRes.rows[0] || null;

      const seatsRes = await db.query('SELECT status FROM seats WHERE route_id = $1', [id]);
      const availableSeats = seatsRes.rows.filter((s) => s.status === 'available').length;

      res.status(200).json({
        success: true,
        route: {
          ...route,
          base_price: Number(route.base_price),
          original_price: route.original_price ? Number(route.original_price) : null,
          features: typeof route.features === 'string' ? JSON.parse(route.features) : route.features,
          carrier,
          totalSeats: seatsRes.rowCount,
          availableSeats,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get live interactive seat layout for a specific route.
   */
  public static async getRouteSeats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = DatabaseManager.getInstance().getService();
      const { id } = req.params as unknown as RouteIdParam;

      // Verify route exists
      const routeRes = await db.query('SELECT id, base_price, seat_layout_type FROM routes WHERE id = $1', [id]);
      if (routeRes.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Belirtilen sefer bulunamadı.',
          code: 'ROUTE_NOT_FOUND',
        });
        return;
      }

      const route = routeRes.rows[0];
      const basePrice = Number(route.base_price);

      // Fetch all seats for the route ordered by row and column
      const seatsRes = await db.query(
        'SELECT * FROM seats WHERE route_id = $1 ORDER BY deck ASC, row_num ASC, col_num ASC',
        [id]
      );

      const seats = seatsRes.rows.map((s) => {
        const surcharge = Number(s.surcharge || 0);
        const multiplier = Number(s.price_multiplier || 1.0);
        const finalPrice = Math.round(basePrice * multiplier + surcharge);

        return {
          id: s.id,
          routeId: s.route_id,
          seatNumber: s.seat_number,
          rowNum: s.row_num,
          colNum: s.col_num,
          tier: s.tier,
          seatType: s.seat_type,
          priceMultiplier: multiplier,
          surcharge,
          price: finalPrice,
          status: s.status,
          genderRestriction: s.gender_restriction,
          cabinClass: s.cabin_class,
          deck: s.deck,
          isExitRow: Boolean(s.is_exit_row),
          isTableSeat: Boolean(s.is_table_seat),
          facingDirection: s.facing_direction,
          hasPowerSocket: Boolean(s.has_power_socket),
          version: s.version,
        };
      });

      const availableCount = seats.filter((s) => s.status === 'available').length;

      res.status(200).json({
        success: true,
        routeId: id,
        seatLayoutType: route.seat_layout_type,
        basePrice,
        totalSeats: seats.length,
        availableSeats: availableCount,
        seats,
      });
    } catch (error) {
      next(error);
    }
  }
}
