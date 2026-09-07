// Multi-source landing-page parsers (KAYNAK_GENISLETME_PLANI.md Phase A). Offline: fixtures are trimmed copies
// of real pages saved on 2026-09-07. No network, no fabricated values: every expected number below is what the
// saved obilet page printed.
import { describe, it, expect } from './test_framework';
import { attrValue, clockDiffMinutes, extractItemscopes, itemprop, nestedScope, parseTrPrice } from '../server/sources/microdata';
import { aggregateLowPrice, busLandingUrl, flightLandingUrl, hotelLandingUrl, jsonLdObjects, parseBusTrips, parseFlights, parseHotels, parseTrDuration, titleMinPrice } from '../server/sources/obilet';
import { SOURCE_IDS, SOURCE_LABELS, SOURCE_ORIGINS, isSourceId } from '../lib/sources/types';
import { allowedUrlGuard, isAllowedSourceUrl, sourceOfAllowedUrl } from '../lib/sources/urls';
import { SOURCE_ADAPTERS, adaptersForKind, biletallAdapter, enuygunAdapter, fetchSourcePage, flixbusAdapter, getSourceAdapter, obiletAdapter, otelzAdapter } from '../server/sources/registry';
import { ATTEMPT_TIMEOUT_MS, REFRESH_THROTTLED_WARNING, ROBOTS_TIMEOUT_SLOW_MS, TOTAL_BUDGET_MS, TurnaFetchError, createRuntimeState, fetchTurnaHtml, hasStructuredData, hostTimeouts, robotsTimeoutMs } from '../server/turna/fetch';
import { ROBOTS_FETCH_FAILED_WARNING, ROBOTS_TIMEOUT_MS, checkRobots, createRobotsState } from '../server/turna/robots';
import type { FetchDeps } from '../server/turna/fetch';
import { WARNING_NO_ITEMS, minPriceOf, runSourceSearch } from '../server/sources/search';
import { SEARCH_CACHE_CONTROL, handleSearchHttp, parseSearchQuery } from '../server/sources/http';
import { TurnaMetrics } from '../server/turna/metrics';
import type { SourceTarget } from '../server/sources/registry';
import type { SearchEnvelope, SourceFailure, SourceSuccess } from '../lib/sources/types';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SEARCH_API_PATH, buildSearchUrl, fetchSearch, isSourceBusTrip, isSourceFlight, isSourceHotel, isSourceRouteFacts, parseSearchEnvelope } from '../lib/sources/client';
import { SourceBadge } from '../components/results/SourceBadge';
import { MAX_ROWS_PER_SOURCE, OTHER_SOURCES_BELOW_HINT, OTHER_SOURCES_DISCLOSURE, OTHER_SOURCES_EMPTY, OTHER_SOURCES_LOADING, OtherSourcesPanel, comparisonSentence, hasOtherSourceRows } from '../components/results/OtherSourcesPanel';
import type { OtherSourcesState } from '../components/results/OtherSourcesPanel';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { LiveSearchState, SearchFilterState } from '../types';
import { ENUYGUN_BUS_PAGE, ENUYGUN_FLIGHT_PAGE, ENUYGUN_HOTEL_PAGE, FLIXBUS_ROUTE_PAGE, OBILET_BUS_PAGE, OBILET_EMPTY_PAGE, OBILET_FLIGHT_PAGE, OBILET_HOTEL_PAGE, OTELZ_HOTEL_PAGE } from './fixtures/sources_fixtures';
import { ENUYGUN_FLIGHT_CITY_CODES, ENUYGUN_HOTEL_REGION_IDS, decodeTrEntities, enuygunBusLandingUrl, enuygunFlightLandingUrl, enuygunHotelLandingUrl, isoDiffMinutes, parseEnuygunBusTrips, parseEnuygunFlights, parseEnuygunHotels, parseIsoDuration, routeCities, splitIsoLocal } from '../server/sources/enuygun';
import { firstClockIn, flixbusRouteLandingUrl, parseFlixbusRouteFacts, parseTrDurationWords, splitRouteName } from '../server/sources/flixbus';
import { extractOtelzFacilities, otelzHotelLandingUrl, parseOtelzHotels } from '../server/sources/otelz';
import { matchHotelRatings, normalizeHotelName, placesCompatible, ratingRefLabel } from '../lib/sources/hotelMatch';
import type { HotelOffer } from '../lib/turna/types';

const OBILET_URL = 'https://www.obilet.com/otobus-bileti/istanbul-ankara';

export function runSourcesTests(): void {
  describe('Sources S: microdata reader', () => {
    it('S.1 extractItemscopes returns one balanced block per BusTrip item and nothing for other types', () => {
      const blocks = extractItemscopes(OBILET_BUS_PAGE, 'BusTrip');
      expect(blocks).toHaveLength(3);
      for (const b of blocks) {
        expect(b.startsWith('<li itemscope itemprop="busTrip"')).toBeTruthy();
        expect(b.endsWith('</li>')).toBeTruthy();
        expect(b.split('<li ').length).toBe(2);
      }
      expect(extractItemscopes(OBILET_BUS_PAGE, 'Flight')).toEqual([]);
      expect(extractItemscopes(OBILET_EMPTY_PAGE, 'BusTrip')).toEqual([]);
      expect(extractItemscopes('', 'BusTrip')).toEqual([]);
    });

    it('S.2 itemprop reads content attributes and element text, nested scopes isolate their properties', () => {
      const [first] = extractItemscopes(OBILET_BUS_PAGE, 'BusTrip');
      const provider = nestedScope(first, 'provider');
      expect(provider).toBeTruthy();
      expect(itemprop(provider as string, 'name')).toBe('Yeni Aksaray Seyahat');
      expect(attrValue(provider as string, 'data-src')).toBe('https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/partner/32395-sm.png');
      expect(itemprop(first, 'departureTime')).toBe('00:15');
      expect(itemprop(first, 'arrivalTime')).toBe('06:30');
      expect(itemprop(nestedScope(first, 'departureBusStop') as string, 'name')).toBe('Alibeyköy Otogarı');
      expect(itemprop(nestedScope(first, 'arrivalBusStop') as string, 'name')).toBe('Ankara (Aşti) Otogarı');
      expect(attrValue(nestedScope(first, 'offers') as string, 'data-price')).toBe('779,0000');
      expect(itemprop(first, 'doesNotExist')).toBe(null);
      expect(nestedScope(first, 'doesNotExist')).toBe(null);
    });

    it('S.3 Turkish prices and clock differences are parsed without inventing values', () => {
      expect(parseTrPrice('779,0000')).toBe(779);
      expect(parseTrPrice('1.465,99')).toBe(1465.99);
      expect(parseTrPrice('560 TL')).toBe(560);
      expect(parseTrPrice('1.470,00 TL')).toBe(1470);
      expect(parseTrPrice('12.500')).toBe(12500);
      expect(parseTrPrice('0')).toBe(null);
      expect(parseTrPrice('')).toBe(null);
      expect(parseTrPrice(null)).toBe(null);
      expect(parseTrPrice('fiyat yok')).toBe(null);
      expect(clockDiffMinutes('00:15', '06:30')).toBe(375);
      expect(clockDiffMinutes('23:30', '05:15')).toBe(345);
      expect(clockDiffMinutes('10:00', '10:00')).toBe(0);
      expect(clockDiffMinutes('24:00', '01:00')).toBe(null);
      expect(clockDiffMinutes(null, '01:00')).toBe(null);
      expect(clockDiffMinutes('1:5', '02:00')).toBe(null);
    });
  });

  describe('Sources O: obilet bus landing page', () => {
    it('O.1 parseBusTrips maps every BusTrip item to a SourceBusTrip with the printed values', () => {
      const trips = parseBusTrips(OBILET_BUS_PAGE, 'obilet', OBILET_URL);
      expect(trips).toHaveLength(3);
      const [a, b, c] = trips;
      expect(a.company).toBe('Yeni Aksaray Seyahat');
      expect(a.companyLogoUrl).toBe('https://s3.eu-central-1.amazonaws.com/static.obilet.com/images/partner/32395-sm.png');
      expect(a.fromCity).toBe('İstanbul Avrupa');
      expect(a.fromStop).toBe('Alibeyköy Otogarı');
      expect(a.toCity).toBe('Ankara');
      expect(a.toStop).toBe('Ankara (Aşti) Otogarı');
      expect(a.departureTime).toBe('00:15');
      expect(a.arrivalTime).toBe('06:30');
      expect(a.durationMinutes).toBe(375);
      expect(a.price).toBe(779);
      expect(a.currency).toBe('TRY');
      expect(a.seatLayout).toBe('2+1');
      expect(a.date).toBe(null);
      expect(a.source).toBe('obilet');
      expect(a.kind).toBe('bus');
      expect(a.sourceUrl).toBe(OBILET_URL);
      expect([b.company, c.company]).toEqual(['As 66 Turizm', 'Mersin Nur Turizm']);
      expect([b.price, c.price]).toEqual([800, 800]);
      expect([b.departureTime, c.departureTime]).toEqual(['01:20', '01:30']);
    });

    it('O.2 ids are 12-hex, deterministic, unique per item and change with the source id', () => {
      const trips = parseBusTrips(OBILET_BUS_PAGE, 'obilet', OBILET_URL);
      const again = parseBusTrips(OBILET_BUS_PAGE, 'obilet', OBILET_URL);
      for (const t of trips) expect(t.id).toMatch(/^[0-9a-f]{12}$/);
      expect(new Set(trips.map((t) => t.id)).size).toBe(3);
      expect(again.map((t) => t.id)).toEqual(trips.map((t) => t.id));
      const twin = parseBusTrips(OBILET_BUS_PAGE, 'biletall', 'https://www.biletall.com/otobus-bileti/istanbul-ankara');
      expect(twin[0].id === trips[0].id).toBeFalsy();
      expect(twin[0].source).toBe('biletall');
    });

    it('O.3 pages without items, malformed items and missing prices are skipped rather than guessed', () => {
      expect(parseBusTrips(OBILET_EMPTY_PAGE, 'obilet', OBILET_URL)).toEqual([]);
      expect(parseBusTrips('', 'obilet', OBILET_URL)).toEqual([]);
      const noPrice = OBILET_BUS_PAGE.replace('data-price="779,0000"', 'data-price=""').replace('779 TL', '');
      expect(parseBusTrips(noPrice, 'obilet', OBILET_URL)).toHaveLength(2);
      const noClock = OBILET_BUS_PAGE.replace('<div itemprop="departureTime">00:15</div>', '<div itemprop="departureTime"></div>');
      expect(parseBusTrips(noClock, 'obilet', OBILET_URL)).toHaveLength(2);
    });

    it('O.4 titleMinPrice reads the "560 TL\'den" figure and the landing URL builder slugifies Turkish', () => {
      expect(titleMinPrice(OBILET_BUS_PAGE)).toBe(560);
      expect(titleMinPrice(OBILET_EMPTY_PAGE)).toBe(null);
      expect(titleMinPrice('')).toBe(null);
      expect(busLandingUrl('obilet', 'İstanbul', 'Ankara')).toBe(OBILET_URL);
      expect(busLandingUrl('biletall', 'İzmir', 'Şanlıurfa')).toBe('https://www.biletall.com/otobus-bileti/izmir-sanliurfa');
    });

    it('O.5 the source registry is closed and labelled', () => {
      expect(SOURCE_IDS).toEqual(['turna', 'obilet', 'biletall', 'otelz', 'enuygun', 'flixbus']);
      expect(SOURCE_LABELS.flixbus).toBe('flixbus.com.tr');
      expect(SOURCE_ORIGINS.flixbus).toBe('https://www.flixbus.com.tr');
      expect(SOURCE_LABELS.enuygun).toBe('enuygun.com');
      expect(SOURCE_LABELS.obilet).toBe('obilet.com');
      expect(SOURCE_ORIGINS.otelz).toBe('https://www.otelz.com');
      expect(isSourceId('obilet')).toBeTruthy();
      expect(isSourceId('enuygun')).toBeTruthy();
      expect(isSourceId('skyscanner')).toBeFalsy();
      expect(isSourceId(null)).toBeFalsy();
    });

    it('O.6 parseFlights maps the JSON-LD Flight objects to SourceFlight rows with clock times and no invented date', () => {
      const url = 'https://www.obilet.com/ucak-bileti/istanbul-ankara';
      const flights = parseFlights(OBILET_FLIGHT_PAGE, 'obilet', url);
      expect(flights).toHaveLength(3);
      const [a, b, c] = flights;
      expect(a.airline).toBe('Pegasus');
      expect(a.airlineCode).toBe('PC');
      expect(a.fromCode).toBe('SAW');
      expect(a.fromName).toBe('Sabiha Gökçen Havalimanı');
      expect(a.toCode).toBe('ESB');
      expect(a.toName).toBe('Ankara Esenboğa Havalimanı');
      expect(a.departureTime).toBe('14:40');
      expect(a.arrivalTime).toBe('15:40');
      expect(a.durationMinutes).toBe(60);
      expect(a.price).toBe(1465.99);
      expect(a.currency).toBe('TRY');
      expect(a.date).toBe(null);
      expect(a.source).toBe('obilet');
      expect(a.kind).toBe('flight');
      expect(a.sourceUrl).toBe(url);
      expect([b.departureTime, c.departureTime]).toEqual(['07:35', '07:25']);
      for (const f of flights) expect(f.id).toMatch(/^[0-9a-f]{12}$/);
      expect(new Set(flights.map((f) => f.id)).size).toBe(3);
      expect(parseFlights(OBILET_FLIGHT_PAGE, 'obilet', url).map((f) => f.id)).toEqual(flights.map((f) => f.id));
      expect(jsonLdObjects(OBILET_FLIGHT_PAGE, 'Airport')).toHaveLength(6);
      expect(jsonLdObjects(OBILET_FLIGHT_PAGE, 'BusTrip')).toEqual([]);
    });

    it('O.7 aggregateLowPrice reads the TravelAction lowPrice and Turkish duration labels become minutes', () => {
      expect(aggregateLowPrice(OBILET_FLIGHT_PAGE)).toBe(1470);
      expect(aggregateLowPrice(OBILET_BUS_PAGE)).toBe(null);
      expect(aggregateLowPrice('')).toBe(null);
      expect(parseTrDuration('1sa 0dk')).toBe(60);
      expect(parseTrDuration('2sa 15dk')).toBe(135);
      expect(parseTrDuration('55dk')).toBe(55);
      expect(parseTrDuration('3 sa')).toBe(180);
      expect(parseTrDuration('0dk')).toBe(null);
      expect(parseTrDuration('')).toBe(null);
      expect(parseTrDuration('uzun')).toBe(null);
      expect(parseTrDuration(null)).toBe(null);
      expect(flightLandingUrl('obilet', 'İstanbul', 'Ankara')).toBe('https://www.obilet.com/ucak-bileti/istanbul-ankara');
    });

    it('O.8 flights without an airline, clock, price or in a foreign currency are skipped; missing duration falls back to the clocks', () => {
      const url = 'https://www.obilet.com/ucak-bileti/istanbul-ankara';
      expect(parseFlights('', 'obilet', url)).toEqual([]);
      expect(parseFlights(OBILET_BUS_PAGE, 'obilet', url)).toEqual([]);
      const noPrice = OBILET_FLIGHT_PAGE.replace('"price": "1465.9900"', '"price": ""');
      expect(parseFlights(noPrice, 'obilet', url)).toHaveLength(2);
      const euro = OBILET_FLIGHT_PAGE.replace('"priceCurrency": "TRY"', '"priceCurrency": "EUR"');
      expect(parseFlights(euro, 'obilet', url)).toHaveLength(2);
      const noAirline = OBILET_FLIGHT_PAGE.replace('"name": "Pegasus"', '"name": ""');
      expect(parseFlights(noAirline, 'obilet', url)).toHaveLength(2);
      const noDuration = OBILET_FLIGHT_PAGE.replace('"estimatedFlightDuration": "1sa 0dk", ', '');
      const withClocks = parseFlights(noDuration, 'obilet', url);
      expect(withClocks).toHaveLength(3);
      expect(withClocks[0].durationMinutes).toBe(60);
    });

    it('O.9 parseHotels maps the JSON-LD Hotel objects to SourceHotel rows without any price field', () => {
      const url = 'https://www.obilet.com/otel/antalya-otelleri';
      const hotels = parseHotels(OBILET_HOTEL_PAGE, 'obilet', url);
      expect(hotels).toHaveLength(3);
      const [a, , c] = hotels;
      expect(a.name).toBe('Miracle Resort Hotel');
      expect(a.url).toBe('https://www.obilet.com/otel/miracle-resort-hotel');
      expect(a.image).toContain('miracle_resort_hotel.jpg');
      expect(a.stars).toBe(5);
      expect(a.rating).toBe(8.8);
      expect(a.ratingBest).toBe(10);
      expect(a.reviewCount).toBe(18);
      expect(a.city).toBe('Antalya');
      expect(a.street).toBe('Kundu, Antalya');
      expect(a.latitude).toBe(36.85513659);
      expect(a.longitude).toBe(30.86016923);
      expect(a.amenities).toEqual(['Havuz', 'Otopark', 'Wi-Fi', 'Beach', 'Hamam', 'Restoran']);
      expect(typeof a.description).toBe('string');
      expect(a.source).toBe('obilet');
      expect(a.kind).toBe('hotel');
      expect(a.sourceUrl).toBe(url);
      expect(c.stars).toBe(3);
      expect('price' in a).toBeFalsy();
      for (const h of hotels) expect(h.id).toMatch(/^[0-9a-f]{12}$/);
      expect(new Set(hotels.map((h) => h.id)).size).toBe(3);
      expect(hotelLandingUrl('obilet', 'Antalya')).toBe(url);
      expect(hotelLandingUrl('obilet', 'Şanlıurfa')).toBe('https://www.obilet.com/otel/sanliurfa-otelleri');
    });

    it('O.10 hotels without a name or URL are skipped and absent ratings stay null instead of defaulting', () => {
      const url = 'https://www.obilet.com/otel/antalya-otelleri';
      expect(parseHotels('', 'obilet', url)).toEqual([]);
      expect(parseHotels(OBILET_BUS_PAGE, 'obilet', url)).toEqual([]);
      const noUrl = OBILET_HOTEL_PAGE.replace('"url": "https://www.obilet.com/otel/miracle-resort-hotel"', '"url": ""');
      expect(parseHotels(noUrl, 'obilet', url)).toHaveLength(2);
      const zeroStars = OBILET_HOTEL_PAGE.replace('"starRating": {"@type": "Rating", "ratingValue": 5}', '"starRating": {"@type": "Rating", "ratingValue": 0}');
      expect(parseHotels(zeroStars, 'obilet', url)[0].stars).toBe(null);
      const noRating = OBILET_HOTEL_PAGE.replace(/"aggregateRating": \{[^}]*\},/, '');
      const first = parseHotels(noRating, 'obilet', url)[0];
      expect(first.rating).toBe(null);
      expect(first.reviewCount).toBe(null);
      expect(first.ratingBest).toBe(10);
    });
  });

    it('O.11 parseOtelzHotels joins the JSON-LD hotels with the Next.js facilities rows by id and publishes no price', () => {
      const url = 'https://www.otelz.com/antalya-otelleri';
      const facilities = extractOtelzFacilities(OTELZ_HOTEL_PAGE);
      expect(facilities.size).toBe(3);
      expect(facilities.get(13808)?.placeName).toBe('Kundu, Aksu, Antalya');
      expect(facilities.get(13808)?.lat).toBe(36.855007);
      const hotels = parseOtelzHotels(OTELZ_HOTEL_PAGE, url);
      expect(hotels).toHaveLength(3);
      const a = hotels[0];
      expect(a.source).toBe('otelz');
      expect(a.kind).toBe('hotel');
      expect(a.name).toBe('Concorde De Luxe Resort Lara Antalya- Prive Ultra All Inclusive');
      expect(a.url).toBe('https://www.otelz.com/hotel/concorde-de-luxe-resort-lara-antalya-prive-ultra-all-inclusive/13808');
      expect(a.image).toContain('imgkit.otelz.com');
      expect(a.stars).toBe(null);
      expect(a.rating).toBe(9.6);
      expect(a.ratingBest).toBe(10);
      expect(a.reviewCount).toBe(20);
      expect(a.city).toBe('Antalya');
      expect(a.street).toBe('Kundu, Aksu, Antalya');
      expect(a.latitude).toBe(36.855007);
      expect(a.longitude).toBe(30.879671);
      expect(typeof a.description).toBe('string');
      expect(a.amenities).toEqual([]);
      expect('price' in a).toBeFalsy();
      expect(a.sourceUrl).toBe(url);
      for (const h of hotels) expect(h.id).toMatch(/^[0-9a-f]{12}$/);
      expect(new Set(hotels.map((h) => h.id)).size).toBe(3);
      expect(otelzHotelLandingUrl('Antalya')).toBe(url);
      expect(otelzHotelLandingUrl('Şanlıurfa')).toBe('https://www.otelz.com/sanliurfa-otelleri');
      expect(otelzAdapter.parse('hotel', OTELZ_HOTEL_PAGE, url)).toHaveLength(3);
      expect(otelzAdapter.parse('bus', OTELZ_HOTEL_PAGE, url)).toEqual([]);
    });

    it('O.12 otelz pages without the Next.js payload still parse from JSON-LD, foreign or duplicate URLs are skipped', () => {
      const url = 'https://www.otelz.com/antalya-otelleri';
      const noNext = OTELZ_HOTEL_PAGE.replace(/<script id="__NEXT_DATA__"[\s\S]*?<\/script>/, '');
      const hotels = parseOtelzHotels(noNext, url);
      expect(hotels).toHaveLength(3);
      expect(hotels[0].latitude).toBe(null);
      expect(hotels[0].street).toBe('Kundu, Aksu, Antalya');
      expect(hotels[0].description).toBe(null);
      expect(hotels[0].rating).toBe(9.6);
      expect(extractOtelzFacilities(noNext).size).toBe(0);
      expect(parseOtelzHotels('', url)).toEqual([]);
      expect(parseOtelzHotels(OBILET_HOTEL_PAGE, url)).toEqual([]);
      const duplicated = OTELZ_HOTEL_PAGE.replace('"itemListElement": [', '"itemListElement": [' + JSON.stringify({ '@type': 'ListItem', position: 99, item: { '@type': 'Hotel', name: 'Kopya', url: 'https://www.otelz.com/hotel/concorde-de-luxe-resort-lara-antalya-prive-ultra-all-inclusive/13808' } }) + ',');
      expect(parseOtelzHotels(duplicated, url)).toHaveLength(3);
      const broken = OTELZ_HOTEL_PAGE.replace('"facilities": [', '"facilities": [{"id": "x"}, ');
      expect(parseOtelzHotels(broken, url)[0].latitude).toBe(36.855007);
    });

    it('O.13 parseEnuygunBusTrips reads dated JSON-LD BusTrips: operator, stops, date + clocks, duration, TRY price', () => {
      const url = 'https://www.enuygun.com/otobus-bileti/istanbul-ankara/';
      const trips = parseEnuygunBusTrips(ENUYGUN_BUS_PAGE, url);
      expect(trips).toHaveLength(3);
      const [a] = trips;
      expect(a.source).toBe('enuygun');
      expect(a.kind).toBe('bus');
      expect(a.company).toBe('Elazığ Hazar Turizm');
      expect(a.fromCity).toBe('İstanbul');
      expect(a.toCity).toBe('Ankara');
      expect(a.fromStop).toBe('Esenler');
      expect(a.toStop).toBe('Ankara (Aşti)');
      expect(a.date).toBe('2026-09-08');
      expect(a.departureTime).toBe('11:29');
      expect(a.arrivalTime).toBe('17:44');
      expect(a.durationMinutes).toBe(375);
      expect(a.price).toBe(500);
      expect(a.currency).toBe('TRY');
      expect(a.companyLogoUrl).toBe(null);
      expect(a.seatLayout).toBe(null);
      expect(a.sourceUrl).toBe(url);
      expect(trips.map((t) => t.price)).toEqual([500, 500, 525]);
      for (const t of trips) expect(t.id).toMatch(/^[0-9a-f]{12}$/);
      expect(new Set(trips.map((t) => t.id)).size).toBe(3);
      expect(enuygunBusLandingUrl('İstanbul', 'Ankara')).toBe(url);
      expect(enuygunAdapter.isAllowedUrl(url)).toBeTruthy();
      expect(enuygunAdapter.parse('bus', ENUYGUN_BUS_PAGE, url)).toHaveLength(3);
      // The browser guard accepts dated enuygun rows.
      expect(isSourceBusTrip(JSON.parse(JSON.stringify(a)))).toBeTruthy();
    });

    it('O.14 enuygun helpers: ISO splitting, day-spanning durations, city names from Product or slug, honest skips', () => {
      expect(splitIsoLocal('2026-09-08T11:29:00')).toEqual({ date: '2026-09-08', clock: '11:29' });
      expect(splitIsoLocal('2026-09-08T23:30:00+03:00')).toEqual({ date: '2026-09-08', clock: '23:30' });
      expect(splitIsoLocal('11:29')).toBe(null);
      expect(splitIsoLocal(null)).toBe(null);
      expect(isoDiffMinutes('2026-09-08T23:30:00', '2026-09-09T05:15:00')).toBe(345);
      expect(isoDiffMinutes('2026-09-08T11:29:00', '2026-09-08T17:44:00')).toBe(375);
      expect(isoDiffMinutes('2026-09-08T11:29:00', null)).toBe(null);
      expect(routeCities(ENUYGUN_BUS_PAGE, 'https://www.enuygun.com/otobus-bileti/istanbul-ankara/')).toEqual({ fromCity: 'İstanbul', toCity: 'Ankara' });
      expect(routeCities('<html></html>', 'https://www.enuygun.com/otobus-bileti/izmir-ankara/')).toEqual({ fromCity: 'Izmir', toCity: 'Ankara' });
      expect(parseEnuygunBusTrips('', 'https://www.enuygun.com/otobus-bileti/istanbul-ankara/')).toEqual([]);
      expect(parseEnuygunBusTrips(OBILET_BUS_PAGE, 'https://www.enuygun.com/otobus-bileti/istanbul-ankara/')).toEqual([]);
      // Target the first trip's offer, not the Product block's AggregateOffer that also says TRY.
      const euro = ENUYGUN_BUS_PAGE.replace('"price": 500, "priceCurrency": "TRY"', '"price": 500, "priceCurrency": "EUR"');
      expect(parseEnuygunBusTrips(euro, 'https://www.enuygun.com/otobus-bileti/istanbul-ankara/')).toHaveLength(2);
      const noPrice = ENUYGUN_BUS_PAGE.replace('"price": 500,', '"price": 0,');
      expect(parseEnuygunBusTrips(noPrice, 'https://www.enuygun.com/otobus-bileti/istanbul-ankara/')).toHaveLength(2);
      const badClock = ENUYGUN_BUS_PAGE.replace('"departureTime": "2026-09-08T11:29:00"', '"departureTime": "11:29"');
      expect(parseEnuygunBusTrips(badClock, 'https://www.enuygun.com/otobus-bileti/istanbul-ankara/')).toHaveLength(2);
    });

    it('O.15 parseEnuygunFlights reads dated JSON-LD flights; arrival is departure plus the published duration', () => {
      const url = 'https://www.enuygun.com/ucak-bileti/istanbul-ankara-ista-anka/';
      const flights = parseEnuygunFlights(ENUYGUN_FLIGHT_PAGE, url);
      expect(flights).toHaveLength(3);
      const [a] = flights;
      expect(a.source).toBe('enuygun');
      expect(a.kind).toBe('flight');
      expect(a.airline).toBe('Pegasus');
      expect(a.airlineCode).toBe('PC');
      expect(a.fromCode).toBe('SAW');
      expect(a.fromName).toBe('Sabiha Gökçen Havalimanı');
      expect(a.toCode).toBe('ESB');
      expect(a.toName).toBe('Esenboğa Havalimanı');
      expect(a.date).toBe('2026-09-11');
      expect(a.departureTime).toBe('19:00');
      expect(a.arrivalTime).toBe('20:00');
      expect(a.durationMinutes).toBe(60);
      expect(a.price).toBe(1487);
      expect(a.currency).toBe('TRY');
      expect(a.sourceUrl).toBe(url);
      expect(flights.map((f) => f.date)).toEqual(['2026-09-11', '2026-10-06', '2026-09-30']);
      expect(flights.map((f) => f.price)).toEqual([1487, 1488, 1489]);
      for (const f of flights) expect(f.id).toMatch(/^[0-9a-f]{12}$/);
      expect(new Set(flights.map((f) => f.id)).size).toBe(3);
      expect(isSourceFlight(JSON.parse(JSON.stringify(a)))).toBeTruthy();
      expect(enuygunAdapter.parse('flight', ENUYGUN_FLIGHT_PAGE, url)).toHaveLength(3);
      // obilet's flights carry clock-only departures; the enuygun parser needs ISO dates, so it honestly yields nothing for them.
      expect(enuygunAdapter.parse('flight', OBILET_FLIGHT_PAGE, url)).toEqual([]);
    });

    it('O.16 enuygun flight helpers: city code table, refused unknown cities, ISO durations, honest skips', () => {
      expect(Object.keys(ENUYGUN_FLIGHT_CITY_CODES)).toHaveLength(13);
      expect(ENUYGUN_FLIGHT_CITY_CODES.istanbul).toBe('ista');
      expect(enuygunFlightLandingUrl('İstanbul', 'Ankara')).toBe('https://www.enuygun.com/ucak-bileti/istanbul-ankara-ista-anka/');
      expect(enuygunFlightLandingUrl('Trabzon', 'İzmir')).toBe('https://www.enuygun.com/ucak-bileti/trabzon-izmir-tzxa-izma/');
      expect(enuygunFlightLandingUrl('İstanbul', 'Bodrum')).toBe(null);
      expect(enuygunFlightLandingUrl('İstanbul', 'istanbul')).toBe(null);
      expect(enuygunAdapter.resolve({ kind: 'flight', from: 'İstanbul', to: 'Ankara' })).toEqual({ source: 'enuygun', kind: 'flight', url: 'https://www.enuygun.com/ucak-bileti/istanbul-ankara-ista-anka/', routeKey: 'enuygun:flight:istanbul-ankara' });
      expect(enuygunAdapter.resolve({ kind: 'flight', from: 'İstanbul', to: 'Bodrum' })).toBe(null);
      expect(enuygunAdapter.isAllowedUrl('https://www.enuygun.com/ucak-bileti/istanbul-ankara-ista-anka/')).toBeTruthy();
      expect(parseIsoDuration('PT1H')).toBe(60);
      expect(parseIsoDuration('PT1H30M')).toBe(90);
      expect(parseIsoDuration('PT45M')).toBe(45);
      expect(parseIsoDuration('P1DT2H')).toBe(1560);
      expect(parseIsoDuration('PT0M')).toBe(null);
      expect(parseIsoDuration('1sa 0dk')).toBe(null);
      expect(parseIsoDuration(null)).toBe(null);
      const url = 'https://www.enuygun.com/ucak-bileti/istanbul-ankara-ista-anka/';
      expect(parseEnuygunFlights('', url)).toEqual([]);
      expect(parseEnuygunFlights(ENUYGUN_BUS_PAGE, url)).toEqual([]);
      const euro = ENUYGUN_FLIGHT_PAGE.replace('"price": 1487, "priceCurrency": "TRY"', '"price": 1487, "priceCurrency": "EUR"');
      expect(parseEnuygunFlights(euro, url)).toHaveLength(2);
      const noDuration = ENUYGUN_FLIGHT_PAGE.replace('"estimatedFlightDuration": "PT1H", ', '');
      const withoutDuration = parseEnuygunFlights(noDuration, url);
      // Without a duration or a printed arrival there is nothing honest to show for the arrival clock, so the row is skipped.
      expect(withoutDuration.length < 3).toBeTruthy();
      const badDeparture = ENUYGUN_FLIGHT_PAGE.replace('"departureTime": "2026-09-11T19:00:00+03:00"', '"departureTime": "19:00"');
      expect(parseEnuygunFlights(badDeparture, url)).toHaveLength(2);
    });

    it('O.17 parseEnuygunHotels reads JSON-LD hotels with district and a 0..10 score, no stars and no price; foreign pages yield nothing', () => {
      const url = 'https://www.enuygun.com/otel/bolge/antalya-481/';
      const hotels = parseEnuygunHotels(ENUYGUN_HOTEL_PAGE, url);
      expect(hotels).toHaveLength(3);
      const [first, , third] = hotels;
      expect(first.source).toBe('enuygun');
      expect(first.kind).toBe('hotel');
      expect(first.name).toBe('Concorde De Luxe Resort Lara Antalya');
      expect(first.url).toBe('https://www.enuygun.com/otel/detay/concorde-de-luxe-resort-lara-antalya-prive-ultra-all-inclusive-218570/');
      expect(first.image).toBe('https://cdn3.enuygun.com/media/lib/1x420/uploads/image/concorde-de-luxe-lara-antalya-antalya-dis-mekan-76469956.webp');
      expect(first.city).toBe('Antalya');
      expect(first.street).toBe('Aksu, Antalya');
      expect(first.stars).toBe(null);
      expect(first.rating).toBe(9.2);
      expect(first.ratingBest).toBe(10);
      expect(first.reviewCount).toBe(37);
      expect(first.latitude).toBe(null);
      expect(first.amenities).toEqual([]);
      expect('price' in first).toBeFalsy();
      expect(first.description?.startsWith("Concorde De Luxe Resort, Antalya'nın")).toBeTruthy();
      expect(first.description?.includes('için')).toBeTruthy();
      expect(first.description?.includes('&ccedil;')).toBeFalsy();
      expect((first.description ?? '').length <= 300).toBeTruthy();
      expect(first.sourceUrl).toBe(url);
      expect(third.name).toBe('Swandor Hotels & Resort Topkapı Palace');
      expect(hotels.map((h) => h.street)).toEqual(['Aksu, Antalya', 'Serik, Antalya', 'Aksu, Antalya']);
      expect(hotels.map((h) => h.rating)).toEqual([9.2, 8.2, 9.4]);
      expect(new Set(hotels.map((h) => h.id)).size).toBe(3);
      expect(enuygunAdapter.parse('hotel', ENUYGUN_HOTEL_PAGE, url)).toHaveLength(3);
      // obilet's hotel page also carries JSON-LD Hotel objects, but they link to obilet.com, so enuygun claims none of them.
      expect(parseEnuygunHotels(OBILET_HOTEL_PAGE, url)).toEqual([]);
      expect(parseEnuygunHotels(OBILET_EMPTY_PAGE, url)).toEqual([]);
      // Region table, alias, refusal of unknown cities and Turkish named entities.
      expect(Object.keys(ENUYGUN_HOTEL_REGION_IDS)).toHaveLength(20);
      expect(enuygunHotelLandingUrl('Antalya')).toBe(url);
      expect(enuygunHotelLandingUrl('İstanbul')).toBe('https://www.enuygun.com/otel/bolge/istanbul-1639/');
      expect(enuygunHotelLandingUrl('Mersin')).toBe('https://www.enuygun.com/otel/bolge/mersin-province-553248635458625001/');
      expect(enuygunHotelLandingUrl('Rize')).toBe(null);
      expect(decodeTrEntities('i&ccedil;in b&ouml;lge &amp; &#39;a&#39; &foo;')).toBe("için bölge & 'a' &foo;");
    });

    it('O.18 parseFlixbusRouteFacts reads route-level facts (lowest price, duration, first and last departure, stops) and never a timetable', () => {
      const url = 'https://www.flixbus.com.tr/otobus-seferleri/ankara-istanbul';
      const facts = parseFlixbusRouteFacts(FLIXBUS_ROUTE_PAGE, url);
      expect(facts === null).toBeFalsy();
      if (!facts) throw new Error('unreachable');
      expect(facts.source).toBe('flixbus');
      expect(facts.kind).toBe('route');
      expect(facts.fromCity).toBe('Ankara');
      expect(facts.toCity).toBe('İstanbul Avrupa');
      expect(facts.lowPrice).toBe(999);
      expect(facts.currency).toBe('TRY');
      expect(facts.offerCount).toBe(10);
      expect(facts.durationMinutes).toBe(405);
      expect(facts.distanceKm).toBe(540);
      expect(facts.firstDeparture).toBe('01:00');
      expect(facts.lastDeparture).toBe('23:59');
      expect(facts.departureStops).toEqual(['Ankara-Otogar', 'Seferpark Niğde rest station']);
      expect(facts.arrivalStops).toEqual(['İstanbul-Esenler Otogar', 'İstanbul-Alibeyköy']);
      expect(facts.operatorName).toBe('Flixbus');
      expect(facts.operatorLogoUrl).toBe('https://cdn-cf.cms.flixbus.com/drupal-assets/logos/flixbus.png');
      expect(facts.hasTimetable).toBe(false);
      expect(facts.sourceUrl).toBe(url);
      expect('departureTime' in facts).toBeFalsy();
      expect(facts.id).toHaveLength(12);
      // Pages whose BusTrip objects do not link to flixbus.com.tr are not attributed to flixbus.
      expect(parseFlixbusRouteFacts(OBILET_BUS_PAGE, url)).toBe(null);
      expect(parseFlixbusRouteFacts(ENUYGUN_BUS_PAGE, url)).toBe(null);
      expect(parseFlixbusRouteFacts(OBILET_EMPTY_PAGE, url)).toBe(null);
      // A non-TRY aggregate offer yields no price; without the FAQ the duration and clocks stay null while the price remains.
      const euro = parseFlixbusRouteFacts(FLIXBUS_ROUTE_PAGE.replace('"priceCurrency": "TRY"', '"priceCurrency": "EUR"'), url);
      expect(euro?.lowPrice).toBe(null);
      expect(euro?.offerCount).toBe(10);
      const noFaq = parseFlixbusRouteFacts(FLIXBUS_ROUTE_PAGE.replace('"@type": "FAQPage"', '"@type": "Removed"'), url);
      expect(noFaq?.durationMinutes).toBe(null);
      expect(noFaq?.distanceKm).toBe(null);
      expect(noFaq?.firstDeparture).toBe(null);
      expect(noFaq?.lastDeparture).toBe(null);
      expect(noFaq?.lowPrice).toBe(999);
      expect(parseTrDurationWords('yaklaşık 6 saat 45 dakika sürer')).toBe(405);
      expect(parseTrDurationWords('7 saat')).toBe(420);
      expect(parseTrDurationWords('45 dakika')).toBe(45);
      expect(parseTrDurationWords('bilinmiyor')).toBe(null);
      expect(parseTrDurationWords(null)).toBe(null);
      expect(firstClockIn("ilk FlixBus'ın 01:00 saatinde kalkması planlanmaktadır.")).toBe('01:00');
      expect(firstClockIn('saat 7:05')).toBe('07:05');
      expect(firstClockIn('25:00 yok')).toBe(null);
      expect(firstClockIn('saat yok')).toBe(null);
      expect(splitRouteName('Ankara - İstanbul Otobüs Bileti')).toEqual({ fromCity: 'Ankara', toCity: 'İstanbul' });
      expect(splitRouteName('Ankara - İstanbul Avrupa')).toEqual({ fromCity: 'Ankara', toCity: 'İstanbul Avrupa' });
      expect(splitRouteName('Ankara')).toBe(null);
    });

  describe('Sources R: allowlist, registry and shared fetch path', () => {
    const okUrls: Array<[string, string]> = [
      ['https://www.obilet.com/otobus-bileti/istanbul-ankara', 'obilet'],
      ['https://www.obilet.com/ucak-bileti/istanbul-ankara', 'obilet'],
      ['https://www.obilet.com/otel/antalya-otelleri', 'obilet'],
      ['https://www.biletall.com/otobus-bileti/izmir-ankara', 'biletall'],
      ['https://www.otelz.com/antalya-otelleri', 'otelz'],
      ['https://www.enuygun.com/otobus-bileti/istanbul-ankara/', 'enuygun'],
      ['https://www.enuygun.com/ucak-bileti/istanbul-ankara-ista-anka/', 'enuygun'],
      ['https://www.enuygun.com/otel/bolge/antalya-481/', 'enuygun'],
      ['https://www.enuygun.com/otel/bolge/mersin-province-553248635458625001/', 'enuygun'],
      ['https://www.flixbus.com.tr/otobus-seferleri/ankara-istanbul', 'flixbus'],
    ];
    const badUrls = [
      'http://www.obilet.com/otobus-bileti/istanbul-ankara',
      'https://obilet.com/otobus-bileti/istanbul-ankara',
      'https://www.obilet.com/otobus-bileti/istanbul-ankara?date=2026-09-10',
      'https://www.obilet.com/otobus-bileti/istanbul-ankara#seferler',
      'https://www.obilet.com/otobus-bileti/istanbul',
      'https://www.obilet.com/otobus-bileti/istanbul-ankara/2026-09-10',
      'https://www.obilet.com/json/otobus-bileti/istanbul-ankara',
      'https://www.obilet.com/' + 'api' + '/journeys',
      'https://www.obilet.com/ajax/seferler',
      'https://www.obilet.com/arac-kiralama/istanbul',
      'https://www.biletall.com/ucak-bileti/istanbul-ankara',
      'https://www.otelz.com/search?city=antalya',
      'https://www.turna.com/otobus-bileti/istanbul-ankara',
      'https://www.enuygun.com/otobus-bileti/istanbul-ankara',
      'https://www.enuygun.com/ucak-bileti/istanbul-ankara/',
      'https://www.enuygun.com/ucak-bileti/istanbul-ankara-ista-anka',
      'https://www.enuygun.com/otobus-bileti/istanbul-ankara/?date=2026-09-10',
      'https://www.enuygun.com/otel/bolge/antalya-481',
      'https://www.enuygun.com/otel/bolge/antalya/',
      'https://www.enuygun.com/otel/detay/concorde-de-luxe-resort-lara-antalya-218570/',
      'https://www.flixbus.com.tr/otobus-seferleri/ankara-istanbul/',
      'https://www.flixbus.com.tr/otobus/ankara',
      'https://www.flixbus.com.tr/otobus-seferleri/ankara-istanbul?departureDate=2026-09-10',
    ];

    it('R.1 the allowlist accepts only https www landing paths without query or hash and maps them to a source', () => {
      for (const [url, source] of okUrls) {
        expect(isAllowedSourceUrl(url)).toBeTruthy();
        expect(sourceOfAllowedUrl(url)).toBe(source);
      }
      for (const url of badUrls) {
        expect(isAllowedSourceUrl(url)).toBeFalsy();
        expect(sourceOfAllowedUrl(url)).toBe(null);
      }
      expect(allowedUrlGuard('obilet')('https://www.obilet.com/otel/antalya-otelleri')).toBeTruthy();
      expect(allowedUrlGuard('obilet')('https://www.biletall.com/otobus-bileti/izmir-ankara')).toBeFalsy();
      expect(allowedUrlGuard('turna')('https://www.turna.com/otobus-bileti/istanbul-ankara')).toBeFalsy();
    });

    it('R.2 adapters resolve queries to allowed landing URLs and route keys, refusing incomplete ones', () => {
      expect(SOURCE_ADAPTERS.map((a) => a.id)).toEqual(['obilet', 'biletall', 'otelz', 'enuygun', 'flixbus']);
      expect(adaptersForKind('bus').map((a) => a.id)).toEqual(['obilet', 'biletall', 'enuygun', 'flixbus']);
      expect(flixbusAdapter.resolve({ kind: 'bus', from: 'İstanbul', to: 'Ankara' })).toEqual({ source: 'flixbus', kind: 'bus', url: 'https://www.flixbus.com.tr/otobus-seferleri/istanbul-ankara', routeKey: 'flixbus:bus:istanbul-ankara' });
      expect(flixbusAdapter.resolve({ kind: 'hotel', city: 'Antalya' })).toBe(null);
      expect(flixbusAdapter.resolve({ kind: 'flight', from: 'İstanbul', to: 'Ankara' })).toBe(null);
      expect(flixbusRouteLandingUrl('Ankara', 'İstanbul')).toBe('https://www.flixbus.com.tr/otobus-seferleri/ankara-istanbul');
      expect(flixbusAdapter.parse('bus', FLIXBUS_ROUTE_PAGE, 'https://www.flixbus.com.tr/otobus-seferleri/ankara-istanbul')).toHaveLength(1);
      expect(flixbusAdapter.parse('bus', OBILET_BUS_PAGE, 'https://www.flixbus.com.tr/otobus-seferleri/ankara-istanbul')).toEqual([]);
      expect(flixbusAdapter.parse('flight', FLIXBUS_ROUTE_PAGE, 'https://www.flixbus.com.tr/otobus-seferleri/ankara-istanbul')).toEqual([]);
      expect(enuygunAdapter.resolve({ kind: 'bus', from: 'İstanbul', to: 'Ankara' })).toEqual({ source: 'enuygun', kind: 'bus', url: 'https://www.enuygun.com/otobus-bileti/istanbul-ankara/', routeKey: 'enuygun:bus:istanbul-ankara' });
      expect(enuygunAdapter.resolve({ kind: 'hotel', city: 'Antalya' })).toEqual({ source: 'enuygun', kind: 'hotel', url: 'https://www.enuygun.com/otel/bolge/antalya-481/', routeKey: 'enuygun:hotel:antalya' });
      expect(enuygunAdapter.resolve({ kind: 'hotel', city: 'Rize' })).toBe(null);
      expect(adaptersForKind('flight').map((a) => a.id)).toEqual(['obilet', 'enuygun']);
      expect(adaptersForKind('hotel').map((a) => a.id)).toEqual(['obilet', 'otelz', 'enuygun']);
      expect(getSourceAdapter('otelz')).toBe(otelzAdapter);
      expect(getSourceAdapter('turna')).toBe(null);
      expect(otelzAdapter.resolve({ kind: 'hotel', city: 'Antalya' })).toEqual({ source: 'otelz', kind: 'hotel', url: 'https://www.otelz.com/antalya-otelleri', routeKey: 'otelz:hotel:antalya' });
      expect(otelzAdapter.resolve({ kind: 'bus', from: 'a', to: 'b' })).toBe(null);
      const bus = obiletAdapter.resolve({ kind: 'bus', from: 'İstanbul', to: 'Ankara' });
      expect(bus).toEqual({ source: 'obilet', kind: 'bus', url: 'https://www.obilet.com/otobus-bileti/istanbul-ankara', routeKey: 'obilet:bus:istanbul-ankara' });
      expect(obiletAdapter.resolve({ kind: 'flight', from: 'istanbul', to: 'ankara' })?.url).toBe('https://www.obilet.com/ucak-bileti/istanbul-ankara');
      expect(obiletAdapter.resolve({ kind: 'hotel', city: 'Antalya' })).toEqual({ source: 'obilet', kind: 'hotel', url: 'https://www.obilet.com/otel/antalya-otelleri', routeKey: 'obilet:hotel:antalya' });
      expect(obiletAdapter.resolve({ kind: 'hotel', to: 'Şanlıurfa' })?.routeKey).toBe('obilet:hotel:sanliurfa');
      expect(obiletAdapter.resolve({ kind: 'bus', from: 'istanbul', to: 'İstanbul' })).toBe(null);
      expect(obiletAdapter.resolve({ kind: 'bus', from: 'istanbul' })).toBe(null);
      expect(obiletAdapter.resolve({ kind: 'bus', from: 'x', to: 'ankara' })).toBe(null);
      expect(obiletAdapter.resolve({ kind: 'hotel' })).toBe(null);
      expect(biletallAdapter.resolve({ kind: 'bus', from: 'izmir', to: 'ankara' })?.url).toBe('https://www.biletall.com/otobus-bileti/izmir-ankara');
      expect(biletallAdapter.resolve({ kind: 'flight', from: 'izmir', to: 'ankara' })).toBe(null);
      for (const a of SOURCE_ADAPTERS) {
        for (const kind of a.kinds) {
          const t = a.resolve(kind === 'hotel' ? { kind, city: 'Antalya' } : { kind, from: 'İstanbul', to: 'Ankara' });
          expect(t).toBeTruthy();
          expect(a.isAllowedUrl((t as { url: string }).url)).toBeTruthy();
        }
      }
    });

    it('R.3 parse dispatches by kind and tags every offer with the adapter id', () => {
      const bus = obiletAdapter.parse('bus', OBILET_BUS_PAGE, OBILET_URL);
      const flights = obiletAdapter.parse('flight', OBILET_FLIGHT_PAGE, 'https://www.obilet.com/ucak-bileti/istanbul-ankara');
      const hotels = obiletAdapter.parse('hotel', OBILET_HOTEL_PAGE, 'https://www.obilet.com/otel/antalya-otelleri');
      expect([bus.length, flights.length, hotels.length]).toEqual([3, 3, 3]);
      for (const o of [...bus, ...flights, ...hotels]) expect(o.source).toBe('obilet');
      expect(bus[0].kind).toBe('bus');
      expect(flights[0].kind).toBe('flight');
      expect(hotels[0].kind).toBe('hotel');
      expect(biletallAdapter.parse('flight', OBILET_FLIGHT_PAGE, OBILET_URL)).toEqual([]);
      expect(biletallAdapter.parse('bus', OBILET_BUS_PAGE, 'https://www.biletall.com/otobus-bileti/istanbul-ankara')[0].source).toBe('biletall');
    });

    it('R.4 fetchSourcePage goes through the hardened Turna fetch layer with the adapter allowlist', async () => {
      const calls: string[] = [];
      let clock = Date.UTC(2026, 8, 7, 12, 0, 0);
      const deps: FetchDeps = {
        fetchImpl: async (input) => {
          const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
          calls.push(url);
          const res = new Response(OBILET_BUS_PAGE, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
          Object.defineProperty(res, 'url', { value: url });
          return res;
        },
        now: () => clock,
        sleep: async () => undefined,
        random: () => 0,
        env: { TURNA_RESPECT_ROBOTS: '0' },
      };
      const state = createRuntimeState();
      const target = obiletAdapter.resolve({ kind: 'bus', from: 'istanbul', to: 'ankara' });
      expect(target).toBeTruthy();
      const first = await fetchSourcePage(target as NonNullable<typeof target>, { deps, state });
      expect(first.via).toBe('direct');
      expect(first.html).toBe(OBILET_BUS_PAGE);
      expect(calls).toEqual(['https://www.obilet.com/otobus-bileti/istanbul-ankara']);
      clock += 5_000;
      const second = await fetchSourcePage(target as NonNullable<typeof target>, { deps, state });
      expect(second.via).toBe('cache');
      expect(second.fetchedAt).toBe(first.fetchedAt);
      expect(calls).toHaveLength(1);
      // The microdata page counts as structured data, so it is not mistaken for a blocked or empty page.
      expect(hasStructuredData(OBILET_BUS_PAGE)).toBeTruthy();
      expect(hasStructuredData('<html><body>hi</body></html>')).toBeFalsy();
      // A URL outside the adapter's allowlist is refused before any request; the Turna allowlist stays the default.
      let refused: unknown = null;
      try {
        await fetchSourcePage({ source: 'obilet', kind: 'bus', url: 'https://www.turna.com/otobus-bileti/istanbul-ankara', routeKey: 'x' }, { deps, state });
      } catch (err) {
        refused = err;
      }
      expect(refused instanceof TurnaFetchError && refused.errorCode === 'invalid_query').toBeTruthy();
      expect(calls).toHaveLength(1);
      let turnaRefused: unknown = null;
      try {
        await fetchTurnaHtml({ url: 'https://www.obilet.com/otobus-bileti/istanbul-ankara' }, { deps, state: createRuntimeState() });
      } catch (err) {
        turnaRefused = err;
      }
      expect(turnaRefused instanceof TurnaFetchError && turnaRefused.errorCode === 'invalid_query').toBeTruthy();
    });

    it('R.5 slow hosts get a longer per-host timeout that still fits the Vercel and browser limits', () => {
      expect(hostTimeouts('www.turna.com')).toEqual({ attemptTimeoutMs: ATTEMPT_TIMEOUT_MS, totalBudgetMs: TOTAL_BUDGET_MS });
      expect(hostTimeouts('www.obilet.com')).toEqual({ attemptTimeoutMs: 10_000, totalBudgetMs: 22_000 });
      const enuygun = hostTimeouts('WWW.ENUYGUN.COM');
      expect(enuygun.attemptTimeoutMs).toBe(24_000);
      expect(enuygun.totalBudgetMs).toBe(26_000);
      expect(enuygun.totalBudgetMs < 28_000).toBeTruthy();
      expect(enuygun.attemptTimeoutMs < enuygun.totalBudgetMs).toBeTruthy();
      expect(hostTimeouts('www.flixbus.com.tr')).toEqual({ attemptTimeoutMs: 24_000, totalBudgetMs: 26_000 });
    });

    it('R.6 slow hosts read robots.txt with a 12 s timeout that still leaves room for one 12.5 s page fetch; timeouts name the limit', async () => {
      expect(ROBOTS_TIMEOUT_MS).toBe(5000);
      expect(robotsTimeoutMs('www.obilet.com')).toBe(ROBOTS_TIMEOUT_MS);
      expect(robotsTimeoutMs('www.turna.com')).toBe(ROBOTS_TIMEOUT_MS);
      expect(robotsTimeoutMs('www.flixbus.com.tr')).toBe(ROBOTS_TIMEOUT_SLOW_MS);
      expect(robotsTimeoutMs('WWW.ENUYGUN.COM')).toBe(12_000);
      expect(ROBOTS_TIMEOUT_SLOW_MS + 12_500 < hostTimeouts('www.flixbus.com.tr').totalBudgetMs).toBeTruthy();
      // checkRobots forwards the timeout; a TimeoutError is reported with the limit that was hit and still fails open.
      const timedOut: typeof fetch = async () => {
        throw Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });
      };
      const verdict = await checkRobots('https://www.flixbus.com.tr/otobus-seferleri/ankara-istanbul', createRobotsState(), { fetchImpl: timedOut, now: () => 0, timeoutMs: robotsTimeoutMs('www.flixbus.com.tr') });
      expect(verdict.allowed).toBeTruthy();
      expect(verdict.warning).toBe(`${ROBOTS_FETCH_FAILED_WARNING} (12 s içinde yanıt yok)`);
      const other: typeof fetch = async () => {
        throw new Error('getaddrinfo ENOTFOUND');
      };
      expect((await checkRobots('https://www.obilet.com/otobus-bileti/istanbul-ankara', createRobotsState(), { fetchImpl: other, now: () => 0 })).warning).toBe(`${ROBOTS_FETCH_FAILED_WARNING} (getaddrinfo ENOTFOUND)`);
    });
  });

  describe('Sources T: parallel search envelope and GET /api/search', () => {
    const FIXED = new Date(Date.UTC(2026, 8, 7, 12, 0, 0));
    const seen: string[] = [];
    const pageFor = (html: string) => async (target: SourceTarget) => {
      seen.push(target.url);
      return { html, via: 'direct' as const, fetchedAt: '2026-09-07T11:59:00.000Z', latencyMs: 7, warnings: [] as string[] };
    };

    it('T.1 runSourceSearch answers per source with attributed items and the cheapest price of each source', async () => {
      const env = await runSourceSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, undefined, { fetchPage: pageFor(OBILET_BUS_PAGE), now: () => FIXED });
      expect(env.success).toBeTruthy();
      expect(env.kind).toBe('bus');
      expect(env.requested).toEqual(['obilet', 'biletall', 'enuygun', 'flixbus']);
      expect(env.results).toHaveLength(4);
      const [ob, ba] = env.results as SourceSuccess[];
      expect(ob.success && ob.source).toBe('obilet');
      expect(ob.routeKey).toBe('obilet:bus:istanbul-ankara');
      expect(ob.items).toHaveLength(3);
      expect(ob.items.every((i) => i.source === 'obilet')).toBeTruthy();
      expect(ob.minPrice).toBe(779);
      expect(ob.fetchedVia).toBe('direct');
      expect(ob.scrapedAt).toBe('2026-09-07T11:59:00.000Z');
      expect(ob.warnings).toEqual([]);
      expect(ba.source).toBe('biletall');
      expect(ba.items.every((i) => i.source === 'biletall')).toBeTruthy();
      // The obilet fixture carries no enuygun JSON-LD, so enuygun reports zero trips honestly.
      expect((env.results[2] as SourceSuccess).items).toEqual([]);
      // flixbus attributes nothing to itself on an obilet page either; its route facts need a flixbus BusTrip.
      expect((env.results[3] as SourceSuccess).items).toEqual([]);
      expect((env.results[3] as SourceSuccess).warnings).toEqual([WARNING_NO_ITEMS]);
      expect(env.cheapestBySource).toEqual({ obilet: 779, biletall: 779, enuygun: null, flixbus: null });
      expect(env.generatedAt).toBe(FIXED.toISOString());
      const hotels = await runSourceSearch({ kind: 'hotel', city: 'antalya' }, undefined, { fetchPage: pageFor(OBILET_HOTEL_PAGE), now: () => FIXED });
      expect(hotels.requested).toEqual(['obilet', 'otelz', 'enuygun']);
      expect((hotels.results[0] as SourceSuccess).minPrice).toBe(null);
      // The obilet fixture is not an otelz page, so the otelz adapter honestly reports zero hotels with a warning.
      expect((hotels.results[1] as SourceSuccess).items).toEqual([]);
      expect((hotels.results[1] as SourceSuccess).warnings).toEqual([WARNING_NO_ITEMS]);
      // The obilet fixture's hotels link to obilet.com, so the enuygun adapter attributes none of them to enuygun.
      expect((hotels.results[2] as SourceSuccess).items).toEqual([]);
      expect(hotels.cheapestBySource).toEqual({ obilet: null, otelz: null, enuygun: null });
      expect(minPriceOf([])).toBe(null);
    });

    it('T.2 requested sources are validated: unknown, unavailable and kind-mismatched ids fail inside the envelope', async () => {
      const env = await runSourceSearch({ kind: 'flight', from: 'istanbul', to: 'ankara' }, ['obilet', 'biletall', 'turna', 'enuygun', 'skyscanner'], { fetchPage: pageFor(OBILET_FLIGHT_PAGE), now: () => FIXED });
      expect(env.requested).toEqual(['obilet', 'biletall', 'turna', 'enuygun']);
      const byId = Object.fromEntries(env.results.map((r) => [r.source, r]));
      expect((byId.obilet as SourceSuccess).items).toHaveLength(3);
      expect((byId.biletall as SourceFailure).errorCode).toBe('kind_not_supported');
      expect((byId.turna as SourceFailure).errorCode).toBe('source_not_available');
      expect(byId.otelz).toBe(undefined);
      // enuygun serves flights for its 13 coded cities; the obilet fixture is not an enuygun page, so it reports zero flights honestly.
      expect((byId.enuygun as SourceSuccess).items).toEqual([]);
      expect((byId.enuygun as SourceSuccess).warnings).toEqual([WARNING_NO_ITEMS]);
      expect((byId.skyscanner as SourceFailure).errorCode).toBe('unknown_source');
      expect(env.cheapestBySource).toEqual({ obilet: 1465.99, enuygun: null });
    });

    it('T.3 fetch failures keep the source error code and retry hint; empty pages succeed with a warning', async () => {
      const blocked = async () => {
        throw new TurnaFetchError('blocked', 'obilet erişimi geçici olarak engellendi', { retryAfterSeconds: 42 });
      };
      const env = await runSourceSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, ['obilet'], { fetchPage: blocked, now: () => FIXED });
      const r = env.results[0] as SourceFailure;
      expect(r.success).toBeFalsy();
      expect(r.errorCode).toBe('blocked');
      expect(r.retryAfterSeconds).toBe(42);
      expect(env.cheapestBySource).toEqual({});
      const crash = await runSourceSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, ['obilet'], { fetchPage: async () => { throw new Error('kaboom'); }, now: () => FIXED });
      expect((crash.results[0] as SourceFailure).errorCode).toBe('internal_error');
      const empty = await runSourceSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, ['obilet'], { fetchPage: pageFor(OBILET_EMPTY_PAGE), now: () => FIXED });
      const e = empty.results[0] as SourceSuccess;
      expect(e.success).toBeTruthy();
      expect(e.items).toEqual([]);
      expect(e.minPrice).toBe(null);
      expect(e.warnings).toEqual([WARNING_NO_ITEMS]);
      const unresolved = await runSourceSearch({ kind: 'bus', from: 'istanbul', to: 'istanbul' }, ['obilet'], { fetchPage: pageFor(OBILET_BUS_PAGE), now: () => FIXED });
      expect((unresolved.results[0] as SourceFailure).errorCode).toBe('invalid_query');
    });

    it('T.4 handleSearchHttp validates the query, answers 200 envelopes, caches only successes and refuses other methods', async () => {
      const deps = { fetchPage: pageFor(OBILET_BUS_PAGE), now: () => FIXED };
      const ok = await handleSearchHttp({ method: 'get', url: new URL('http://localhost/api/search?kind=bus&from=İstanbul&to=Ankara&sources=obilet') }, deps);
      expect(ok.status).toBe(200);
      expect(ok.headers['Cache-Control']).toBe(SEARCH_CACHE_CONTROL);
      const body = JSON.parse(ok.body) as SearchEnvelope;
      expect(body.kind).toBe('bus');
      expect(body.requested).toEqual(['obilet']);
      expect((body.results[0] as SourceSuccess).items[0].source).toBe('obilet');
      const refreshed = await handleSearchHttp({ method: 'get', url: new URL('http://localhost/api/search?kind=bus&from=istanbul&to=ankara&refresh=1') }, deps);
      expect(refreshed.headers['Cache-Control']).toBe('no-store');
      const failedAll = await handleSearchHttp({ method: 'get', url: new URL('http://localhost/api/search?kind=bus&from=istanbul&to=ankara&sources=skyscanner') }, deps);
      expect(failedAll.status).toBe(200);
      expect(failedAll.headers['Cache-Control']).toBe('no-store');
      for (const [qs, needle] of [['', "'kind' zorunludur"], ['kind=car', "'kind' bus | flight | hotel olmalı"], ['kind=bus&from=istanbul', "'from' ve 'to' zorunludur"], ['kind=hotel', "'city' zorunludur"]] as const) {
        const res = await handleSearchHttp({ method: 'get', url: new URL(`http://localhost/api/search?${qs}`) }, deps);
        expect(res.status).toBe(400);
        expect(res.body).toContain(needle);
      }
      expect((await handleSearchHttp({ method: 'post', url: new URL('http://localhost/api/search?kind=bus&from=a&to=b') }, deps)).status).toBe(405);
      expect((await handleSearchHttp({ method: 'options', url: new URL('http://localhost/api/search') }, deps)).status).toBe(204);
      const parsed = parseSearchQuery(new URL('http://localhost/api/search?kind=hotel&to=Antalya&sources=obilet, otelz'));
      expect(parsed.ok && parsed.query.to === 'Antalya' && parsed.sources?.join('|') === 'obilet|otelz').toBeTruthy();
    });

    it('T.5 refresh=1 reaches the fetch layer: the source page cache is bypassed at most once a minute per URL, otherwise served from cache', async () => {
      // The flag is forwarded to fetchPage for every source, from runSourceSearch and from the HTTP query string.
      const flags: Array<{ source: string; refresh: boolean }> = [];
      const spy = async (target: SourceTarget, opts: { refresh: boolean }) => {
        flags.push({ source: target.source, refresh: opts.refresh });
        return { html: OBILET_BUS_PAGE, via: 'direct' as const, fetchedAt: '2026-09-07T11:59:00.000Z', latencyMs: 7, warnings: [] as string[] };
      };
      await runSourceSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, ['obilet', 'biletall'], { fetchPage: spy, now: () => FIXED });
      expect(flags).toEqual([{ source: 'obilet', refresh: false }, { source: 'biletall', refresh: false }]);
      flags.length = 0;
      await handleSearchHttp({ method: 'get', url: new URL('http://localhost/api/search?kind=bus&from=istanbul&to=ankara&sources=obilet&refresh=1') }, { fetchPage: spy, now: () => FIXED });
      expect(flags).toEqual([{ source: 'obilet', refresh: true }]);
      flags.length = 0;
      await handleSearchHttp({ method: 'get', url: new URL('http://localhost/api/search?kind=bus&from=istanbul&to=ankara&sources=obilet&refresh=0') }, { fetchPage: spy, now: () => FIXED });
      expect(flags).toEqual([{ source: 'obilet', refresh: false }]);
      // Through the real registry path: cache hit without refresh, upstream fetch with refresh, throttled within a minute.
      const calls: string[] = [];
      let clock = Date.UTC(2026, 8, 7, 12, 0, 0);
      const deps: FetchDeps = {
        fetchImpl: async (input) => {
          const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
          calls.push(url);
          const res = new Response(OBILET_BUS_PAGE, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
          Object.defineProperty(res, 'url', { value: url });
          return res;
        },
        now: () => clock,
        sleep: async () => undefined,
        random: () => 0,
        env: { TURNA_RESPECT_ROBOTS: '0' },
      };
      const state = createRuntimeState();
      const target = obiletAdapter.resolve({ kind: 'bus', from: 'istanbul', to: 'ankara' }) as SourceTarget;
      expect((await fetchSourcePage(target, { deps, state })).via).toBe('direct');
      clock += 5_000;
      expect((await fetchSourcePage(target, { deps, state })).via).toBe('cache');
      expect(calls).toHaveLength(1);
      clock += 5_000;
      expect((await fetchSourcePage(target, { deps, state, refresh: true })).via).toBe('direct');
      expect(calls).toHaveLength(2);
      clock += 5_000;
      const throttled = await fetchSourcePage(target, { deps, state, refresh: true });
      expect(throttled.via).toBe('cache');
      expect(throttled.warnings.includes(REFRESH_THROTTLED_WARNING)).toBeTruthy();
      expect(calls).toHaveLength(2);
      clock += 61_000;
      expect((await fetchSourcePage(target, { deps, state, refresh: true })).via).toBe('direct');
      expect(calls).toHaveLength(3);
    });
  });

  describe('Sources C: browser client, envelope guard and SourceBadge', () => {
    const FIXED = new Date(Date.UTC(2026, 8, 7, 12, 0, 0));
    const pageFor = (html: string) => async () => ({ html, via: 'direct' as const, fetchedAt: '2026-09-07T11:59:00.000Z', latencyMs: 7, warnings: [] as string[] });

    it('C.1 buildSearchUrl encodes the query and optional sources/refresh', () => {
      expect(SEARCH_API_PATH).toBe('/api/search');
      expect(buildSearchUrl({ kind: 'bus', from: 'İstanbul', to: 'Ankara' })).toBe('/api/search?kind=bus&from=%C4%B0stanbul&to=Ankara');
      expect(buildSearchUrl({ kind: 'hotel', city: 'Antalya' }, ['obilet', 'otelz'], true)).toBe('/api/search?kind=hotel&city=Antalya&sources=obilet%2Cotelz&refresh=1');
      expect(buildSearchUrl({ kind: 'hotel', to: 'Antalya' })).toBe('/api/search?kind=hotel&city=Antalya');
      expect(buildSearchUrl({ kind: 'flight', from: 'istanbul', to: 'ankara' }, [])).toBe('/api/search?kind=flight&from=istanbul&to=ankara');
    });

    it('C.2 parseSearchEnvelope accepts the server envelope verbatim and drops rows the guard refuses', async () => {
      const env = await runSourceSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, undefined, { fetchPage: pageFor(OBILET_BUS_PAGE), now: () => FIXED });
      const wire = JSON.parse(JSON.stringify(env)) as unknown;
      const parsed = parseSearchEnvelope(wire);
      expect(parsed).toBeTruthy();
      expect(parsed?.dropped).toBe(0);
      expect(JSON.stringify(parsed?.envelope)).toBe(JSON.stringify(env));
      const flights = await runSourceSearch({ kind: 'flight', from: 'istanbul', to: 'ankara' }, undefined, { fetchPage: pageFor(OBILET_FLIGHT_PAGE), now: () => FIXED });
      expect(parseSearchEnvelope(JSON.parse(JSON.stringify(flights)))?.dropped).toBe(0);
      const hotels = await runSourceSearch({ kind: 'hotel', city: 'antalya' }, undefined, { fetchPage: pageFor(OBILET_HOTEL_PAGE), now: () => FIXED });
      expect(parseSearchEnvelope(JSON.parse(JSON.stringify(hotels)))?.dropped).toBe(0);
      // Tampered rows: a price of 0, a missing source, a clock in the wrong format are refused one by one.
      const tampered = JSON.parse(JSON.stringify(env)) as { results: Array<{ items: Array<Record<string, unknown>>; minPrice: number | null }> };
      tampered.results[0].items[0].price = 0;
      tampered.results[0].items[1].departureTime = '7:5';
      delete tampered.results[0].items[2].source;
      const out = parseSearchEnvelope(tampered);
      expect(out?.dropped).toBe(3);
      const first = out?.envelope.results[0] as SourceSuccess;
      expect(first.items).toEqual([]);
      expect(first.minPrice).toBe(null);
      expect(out?.envelope.cheapestBySource.obilet).toBe(null);
      // Malformed envelopes are rejected as a whole.
      expect(parseSearchEnvelope(null)).toBe(null);
      expect(parseSearchEnvelope({ success: false, error: 'x', errorCode: 'y' })).toBe(null);
      expect(parseSearchEnvelope({ success: true, kind: 'car', results: [], requested: [], generatedAt: 'x' })).toBe(null);
      expect(parseSearchEnvelope({ success: true, kind: 'bus', results: [{ success: true, source: 'obilet' }], requested: [], generatedAt: 'x' })).toBe(null);
      const failures = parseSearchEnvelope({ success: true, kind: 'bus', results: [{ success: false, source: 'obilet', errorCode: 'blocked', error: 'e', retryAfterSeconds: 9 }], requested: ['obilet'], generatedAt: 'x', query: {} });
      expect((failures?.envelope.results[0] as SourceFailure).retryAfterSeconds).toBe(9);
      expect(isSourceBusTrip({})).toBeFalsy();
      expect(isSourceFlight({})).toBeFalsy();
      expect(isSourceHotel({})).toBeFalsy();
    });

    it('C.3 fetchSearch maps HTTP failures, invalid bodies, network errors and aborts to honest client states', async () => {
      const env = await runSourceSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, ['obilet'], { fetchPage: pageFor(OBILET_BUS_PAGE), now: () => FIXED });
      const respond = (status: number, body: unknown): typeof fetch => async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
      const ok = await fetchSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, { fetchImpl: respond(200, env), now: () => FIXED });
      expect(ok.status).toBe('ok');
      if (ok.status === 'ok') {
        expect(ok.envelope.results).toHaveLength(1);
        expect(ok.dropped).toBe(0);
        expect(ok.receivedAt).toBe(FIXED.toISOString());
      }
      const bad = await fetchSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, { fetchImpl: respond(400, { success: false, errorCode: 'invalid_query', error: "'from' ve 'to' zorunludur" }) });
      expect(bad).toEqual({ status: 'error', httpStatus: 400, errorCode: 'invalid_query', message: "'from' ve 'to' zorunludur" });
      const garbage = await fetchSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, { fetchImpl: respond(200, { hello: 'world' }) });
      expect(garbage.status === 'error' && garbage.errorCode === 'invalid_response').toBeTruthy();
      const network = await fetchSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, { fetchImpl: async () => { throw new Error('offline'); } });
      expect(network.status === 'error' && network.errorCode === 'network_error' && network.message === 'offline').toBeTruthy();
      const controller = new AbortController();
      controller.abort();
      const aborted = await fetchSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, { signal: controller.signal, fetchImpl: async () => { throw new Error('aborted'); } });
      expect(aborted.status === 'error' && aborted.errorCode === 'aborted').toBeTruthy();
      const slow = await fetchSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, { timeoutMs: 5, fetchImpl: (_input, init) => new Promise((_resolve, reject) => { init?.signal?.addEventListener('abort', () => reject(new Error('aborted by timer'))); }) });
      expect(slow.status === 'error' && slow.errorCode === 'timeout').toBeTruthy();
    });

    it('C.4 SourceBadge prints the site label, links only to https landing pages and carries no dot', () => {
      const plain = renderToStaticMarkup(React.createElement(SourceBadge, { source: 'obilet' }));
      expect(plain).toContain('data-source-badge="obilet"');
      expect(plain).toContain('>obilet.com<');
      expect(plain).toContain('title="Kaynak: obilet.com"');
      expect(plain).toNotContain('<a ');
      const linked = renderToStaticMarkup(React.createElement(SourceBadge, { source: 'turna', href: 'https://www.turna.com/otobus-bileti/istanbul-ankara', size: 'md' }));
      expect(linked).toContain('<a href="https://www.turna.com/otobus-bileti/istanbul-ankara"');
      expect(linked).toContain('rel="noopener noreferrer"');
      expect(linked).toContain('>Turna.com<');
      const unsafe = renderToStaticMarkup(React.createElement(SourceBadge, { source: 'otelz', href: 'http://evil.example/x' }));
      expect(unsafe).toNotContain('<a ');
      for (const html of [plain, linked]) expect(html).toNotContain('rounded-full');
    });
  });

  describe('Sources U: OtherSourcesPanel SSR', () => {
    const FIXED = new Date(Date.UTC(2026, 8, 7, 12, 0, 0));
    const pageFor = (html: string) => async () => ({ html, via: 'direct' as const, fetchedAt: '2026-09-07T11:59:00.000Z', latencyMs: 7, warnings: [] as string[] });
    const render = (state: OtherSourcesState | undefined, kind: 'bus' | 'flight' | 'hotel', turnaMinPrice?: number | null): string =>
      renderToStaticMarkup(React.createElement(OtherSourcesPanel, { state, kind, turnaMinPrice }));
    const okState = async (kind: 'bus' | 'flight' | 'hotel', html: string, sources?: string[]): Promise<OtherSourcesState> => {
      const query = kind === 'hotel' ? { kind, city: 'antalya' } : { kind, from: 'istanbul', to: 'ankara' };
      const env = await runSourceSearch(query, sources, { fetchPage: pageFor(html), now: () => FIXED });
      const parsed = parseSearchEnvelope(JSON.parse(JSON.stringify(env)));
      if (!parsed) throw new Error('fixture envelope invalid');
      return { status: 'ok', envelope: parsed.envelope, dropped: parsed.dropped, receivedAt: FIXED.toISOString() };
    };
    const noDots = (html: string): number => (html.match(/rounded-full[^"]*bg-(emerald|amber)-500/g) ?? []).length;

    it('U.6 flixbus route facts render as one attributed facts row: starting price, typical duration, first/last departure, no timetable', async () => {
      const state = await okState('bus', FLIXBUS_ROUTE_PAGE, ['flixbus']);
      expect((state as { dropped: number }).dropped).toBe(0);
      const html = render(state, 'bus', 500);
      expect(html).toContain('data-source-section="flixbus"');
      expect(html).toContain('1 rota bilgisi');
      // React escapes the apostrophe in SSR output.
      expect(html).toContain('999 TL&#x27;den başlayan fiyat');
      expect(html).toContain('ilk 01:00, son 23:59');
      expect(html).toContain('yaklaşık 6s 45dk');
      expect(html).toContain('Ankara-Otogar / Seferpark Niğde rest station');
      expect(html).toContain('Tarife yayımlanmıyor');
      expect(html).toContain('data-route-facts');
      expect(html).toContain('Kaynaklar arası en düşük fiyat: Turna.com 500 TL, flixbus.com.tr 999 TL&#x27;den.');
      expect(comparisonSentence((state as { envelope: { results: SourceSuccess[] } }).envelope.results, 500)).toBe("Kaynaklar arası en düşük fiyat: Turna.com 500 TL, flixbus.com.tr 999 TL'den.");
      expect(html).toNotContain('en düşük 999 TL');
      expect(html).toNotContain('data-trip-date');
      expect(noDots(html)).toBe(0);
      // The client guard accepts genuine facts and refuses tampered ones.
      const facts = parseFlixbusRouteFacts(FLIXBUS_ROUTE_PAGE, 'https://www.flixbus.com.tr/otobus-seferleri/ankara-istanbul');
      expect(isSourceRouteFacts(facts)).toBeTruthy();
      expect(isSourceRouteFacts({ ...facts, hasTimetable: true })).toBeFalsy();
      expect(isSourceRouteFacts({ ...facts, lowPrice: 0 })).toBeFalsy();
      expect(isSourceRouteFacts({ ...facts, firstDeparture: '7:5' })).toBeFalsy();
      expect(isSourceRouteFacts({ ...facts, departureTime: '01:00' })).toBeFalsy();
      expect(isSourceRouteFacts({ ...facts, source: 'skyscanner' })).toBeFalsy();
      // A wire envelope with a tampered facts row drops exactly that row.
      const env = await runSourceSearch({ kind: 'bus', from: 'ankara', to: 'istanbul' }, ['flixbus'], { fetchPage: pageFor(FLIXBUS_ROUTE_PAGE), now: () => FIXED });
      const wire = JSON.parse(JSON.stringify(env)) as { results: Array<{ items: Array<Record<string, unknown>> }> };
      wire.results[0].items[0].hasTimetable = true;
      expect(parseSearchEnvelope(wire)?.dropped).toBe(1);
    });

    it('U.1 bus sources render one attributed section per source with rows, counts, minimum and page link', async () => {
      const html = render(await okState('bus', OBILET_BUS_PAGE), 'bus');
      expect(html).toContain('data-other-sources="ok"');
      expect(html).toContain('Diğer kaynaklar');
      expect(html).toContain('data-source-section="obilet"');
      expect(html).toContain('data-source-section="biletall"');
      expect(html).toContain('data-source-badge="obilet"');
      expect(html).toContain('href="https://www.obilet.com/otobus-bileti/istanbul-ankara"');
      expect(html).toContain('href="https://www.biletall.com/otobus-bileti/istanbul-ankara"');
      expect(html).toContain('3 sefer, en düşük 779 TL');
      expect(html).toContain('Yeni Aksaray Seyahat');
      expect(html).toContain('Alibeyköy Otogarı');
      expect(html).toContain('2+1');
      expect(html).toContain('6s 15dk');
      expect(html).toContain('Canlı alındı');
      expect(html).toContain(OTHER_SOURCES_DISCLOSURE);
      // Two sources with the same minimum still form a comparison sentence; Turna joins when given.
      expect(html).toContain('Kaynaklar arası en düşük fiyat: obilet.com 779 TL, biletall.com 779 TL.');
      const withTurna = render(await okState('bus', OBILET_BUS_PAGE), 'bus', 500);
      expect(withTurna).toContain('Kaynaklar arası en düşük fiyat: Turna.com 500 TL, obilet.com 779 TL, biletall.com 779 TL.');
      expect(noDots(html)).toBe(0);
      expect(html).toNotContain('undefined');
      expect(html).toNotContain('NaN');
    });

    it('U.1b dated sources show a day chip on each row; clock-only sources show none', async () => {
      const dated = render(await okState('bus', ENUYGUN_BUS_PAGE, ['enuygun']), 'bus');
      expect(dated).toContain('data-source-section="enuygun"');
      expect((dated.match(/data-trip-date="2026-09-08"/g) ?? []).length).toBe(3);
      expect(dated).toContain('Sal 8 Eyl');
      expect(dated).toContain('Elazığ Hazar Turizm');
      expect(dated).toContain('11:29');
      expect(dated).toContain('6s 15dk');
      expect(dated).toContain('3 sefer, en düşük 500 TL');
      const clockOnly = render(await okState('bus', OBILET_BUS_PAGE, ['obilet']), 'bus');
      expect(clockOnly).toNotContain('data-trip-date');
    });

    it('U.2 flight and hotel sections use their own row shapes; hotels never show a price', async () => {
      const flights = render(await okState('flight', OBILET_FLIGHT_PAGE), 'flight');
      expect(flights).toContain('3 uçuş, en düşük 1.465,99 TL'.replace('1.465,99 TL', '1.466 TL'));
      expect(flights).toContain('Pegasus');
      expect(flights).toContain('SAW');
      expect(flights).toContain('ESB');
      expect(flights).toContain('1s 00dk');
      const hotels = render(await okState('hotel', OBILET_HOTEL_PAGE), 'hotel', 1200);
      expect(hotels).toContain('3 otel');
      expect(hotels).toContain('Miracle Resort Hotel');
      expect(hotels).toContain('8,8/10');
      expect(hotels).toContain('18 yorum');
      expect(hotels).toContain('Fiyat kaynak sitede');
      expect(hotels).toNotContain(' TL<');
      expect(hotels).toNotContain('Kaynaklar arası en düşük fiyat');
      expect((hotels.match(/aria-label="5 yıldız"/g) ?? []).length).toBe(2);
      expect((hotels.match(/aria-label="3 yıldız"/g) ?? []).length).toBe(1);
    });

    it('U.3 loading, error, empty, failure and dropped states are said plainly', async () => {
      expect(render(undefined, 'bus')).toBe('');
      const loading = render({ status: 'loading' }, 'bus');
      expect(loading).toContain('data-other-sources="loading"');
      expect(loading).toContain(OTHER_SOURCES_LOADING);
      expect(loading).toContain('aria-live="polite"');
      const error = render({ status: 'error', httpStatus: 503, errorCode: 'upstream_unavailable', message: 'Arama servisi zamanında yanıt vermedi.' }, 'bus');
      expect(error).toContain('data-other-sources="error"');
      expect(error).toContain('Diğer kaynaklar alınamadı: Arama servisi zamanında yanıt vermedi.');
      const empty = render({ status: 'ok', envelope: { success: true, kind: 'bus', query: {}, requested: [], results: [], cheapestBySource: {}, generatedAt: FIXED.toISOString() }, dropped: 0, receivedAt: FIXED.toISOString() }, 'bus');
      expect(empty).toContain(OTHER_SOURCES_EMPTY);
      const failing = await runSourceSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, ['obilet', 'biletall'], {
        fetchPage: async (target) => {
          if (target.source === 'biletall') throw new TurnaFetchError('blocked', 'biletall.com erişimi geçici olarak engellendi', { retryAfterSeconds: 42 });
          return pageFor(OBILET_BUS_PAGE)();
        },
        now: () => FIXED,
      });
      const parsed = parseSearchEnvelope(JSON.parse(JSON.stringify(failing)));
      const mixed = render({ status: 'ok', envelope: parsed!.envelope, dropped: 2, receivedAt: FIXED.toISOString() }, 'bus');
      expect(mixed).toContain('data-source-section="obilet"');
      expect(mixed).toContain('data-source-failure="biletall"');
      expect(mixed).toContain('biletall.com erişimi geçici olarak engellendi 42 sn sonra tekrar deneyin.');
      expect(mixed).toContain('2 satır doğrulanamadı ve listelenmedi.');
      expect(mixed).toNotContain('Kaynaklar arası en düşük fiyat');
      expect(comparisonSentence([], null)).toBe(null);
      expect(MAX_ROWS_PER_SOURCE).toBe(10);
    });

    it('U.7 accessibility: labelled region in every state, polite loading, alert on error, new-tab links say so, icons hidden', async () => {
      const ok = render(await okState('bus', OBILET_BUS_PAGE), 'bus');
      expect(ok).toContain('<section aria-label="Diğer kaynaklar"');
      expect(ok).toContain('data-other-sources="ok"');
      const newTab = (ok.match(/target="_blank"/g) ?? []).length;
      expect(newTab > 0).toBeTruthy();
      expect((ok.match(/rel="noopener noreferrer"/g) ?? []).length).toBe(newTab);
      expect((ok.match(/\(yeni sekmede açılır\)/g) ?? []).length).toBe(newTab);
      expect((ok.match(/<svg[^>]*aria-hidden="true"/g) ?? []).length).toBe((ok.match(/<svg/g) ?? []).length);
      const loading = render({ status: 'loading' }, 'bus');
      expect(loading).toContain('<section aria-label="Diğer kaynaklar"');
      expect(loading).toContain('aria-live="polite"');
      const error = render({ status: 'error', httpStatus: 503, errorCode: 'upstream_unavailable', message: 'sunucu yok' }, 'bus');
      expect(error).toContain('<section aria-label="Diğer kaynaklar"');
      expect(error).toContain('role="alert"');
      expect(error).toContain('sunucu yok');
      // Hotel rows: the hotel name links to the source page in a new tab and says so; stars sit in a labelled group.
      const hotels = render(await okState('hotel', OBILET_HOTEL_PAGE), 'hotel');
      expect((hotels.match(/\(yeni sekmede açılır\)/g) ?? []).length).toBe((hotels.match(/target="_blank"/g) ?? []).length);
      expect(hotels).toContain('aria-label="5 yıldız"');
      expect(hotels).toContain('data-other-sources="ok"');
    });

    it('U.8 the refresh button path sends refresh=1 end to end and the throttle warning is shown inside the source section', async () => {
      // Browser client -> /api/search handler -> fetchPage, with the refresh flag observed at the very end of the chain.
      const seenRefresh: boolean[] = [];
      const fetchPage = async (_target: SourceTarget, opts: { refresh: boolean }) => {
        seenRefresh.push(opts.refresh);
        return { html: OBILET_BUS_PAGE, via: 'direct' as const, fetchedAt: '2026-09-07T11:59:00.000Z', latencyMs: 7, warnings: opts.refresh ? [REFRESH_THROTTLED_WARNING] : ([] as string[]) };
      };
      const fetchImpl: typeof fetch = async (input) => {
        const href = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const res = await handleSearchHttp({ method: 'get', url: new URL(href, 'http://localhost') }, { fetchPage, now: () => FIXED });
        return new Response(res.body, { status: res.status, headers: { 'content-type': 'application/json', ...res.headers } });
      };
      const plain = await fetchSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, { sources: ['obilet'], fetchImpl, now: () => FIXED });
      expect(plain.status).toBe('ok');
      expect(seenRefresh).toEqual([false]);
      const refreshed = await fetchSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, { sources: ['obilet'], refresh: true, fetchImpl, now: () => FIXED });
      expect(refreshed.status).toBe('ok');
      expect(seenRefresh).toEqual([false, true]);
      // The fetch layer's throttle warning survives the envelope and the client guard, and the panel prints it in the source section.
      if (refreshed.status !== 'ok') throw new Error('unreachable');
      const section = refreshed.envelope.results[0] as SourceSuccess;
      expect(section.warnings).toEqual([REFRESH_THROTTLED_WARNING]);
      const html = render(refreshed, 'bus');
      expect(html).toContain('data-source-section="obilet"');
      expect(html).toContain(`<li>${REFRESH_THROTTLED_WARNING}</li>`);
      expect(html).toContain('3 sefer, en düşük 779 TL');
      // App wiring: the refresh button passes its flag into runOtherSources, which forwards it to fetchSearch.
      const app = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
      expect(app).toContain('void runOtherSources(query, opts.refresh === true);');
      expect(app).toContain('{ signal: controller.signal, refresh }');
    });

    it('U.9 long source lists show MAX_ROWS_PER_SOURCE rows, then an honest "N more on the source page" note before the warnings', async () => {
      const base = await okState('bus', OBILET_BUS_PAGE, ['obilet']);
      if (base.status !== 'ok') throw new Error('unreachable');
      const first = base.envelope.results[0] as SourceSuccess;
      const many = Array.from({ length: 12 }, (_, i) => ({ ...first.items[i % first.items.length], id: `dup${String(i).padStart(8, '0')}` }));
      const long: OtherSourcesState = {
        ...base,
        envelope: { ...base.envelope, results: [{ ...first, items: many, warnings: ['Örnek uyarı'] }] },
      };
      const html = render(long, 'bus');
      expect((html.match(/<li aria-label=/g) ?? []).length).toBe(MAX_ROWS_PER_SOURCE);
      expect(html).toContain('12 sefer, en düşük 779 TL');
      expect(html).toContain('Kaynak sayfada 2 sefer daha var.');
      // Order inside the section: rows, then the overflow note, then the warnings list.
      const noteAt = html.indexOf('Kaynak sayfada 2 sefer daha var.');
      // The first list end is the rows list; the warnings list closes after the note.
      expect(noteAt > html.indexOf('</li></ul>')).toBeTruthy();
      expect(noteAt < html.indexOf('Örnek uyarı')).toBeTruthy();
      // Exactly MAX_ROWS_PER_SOURCE rows means no note.
      const exact: OtherSourcesState = { ...base, envelope: { ...base.envelope, results: [{ ...first, items: many.slice(0, MAX_ROWS_PER_SOURCE) }] } };
      expect(render(exact, 'bus')).toNotContain('daha var');
      expect(render(base, 'bus')).toNotContain('daha var');
    });
  });

  describe('Sources W: App and SearchResults wiring', () => {
    const readSrc = (rel: string): string => fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
    const BASE_STATE: SearchFilterState = {
      transportType: 'otobus',
      fromCity: 'İstanbul',
      toCity: 'Ankara',
      departureDate: '',
      passengerCount: 1,
      maxPrice: 5000,
      selectedCompanies: [],
      departureTimeRange: 'all',
      onlyDirect: false,
      seatTypePreference: 'all',
      sortBy: 'cheapest',
    };

    it('W.1 App fetches the other sources alongside Turna and hands them to SearchResults; ferry and car have no source', () => {
      const app = readSrc('src/App.tsx');
      for (const needle of ["from './lib/sources/client'", 'void runOtherSources(query, opts.refresh === true);', "setOtherSources({ status: 'loading' })", 'otherSources={otherSources}', "kind === 'bus' || kind === 'flight' || kind === 'hotel' ? kind : null", 'otherSourcesAbortRef.current?.abort();']) {
        expect(app).toContain(needle);
      }
      const results = readSrc('src/components/SearchResults.tsx');
      for (const needle of ["from './results/OtherSourcesPanel'", 'otherSources?: OtherSourcesState;', '<OtherSourcesPanel state={otherSources} kind={otherSourcesKind} turnaMinPrice={stats?.min ?? null}']) {
        expect(results).toContain(needle);
      }
      // Route list, empty-ok notice, bus/flight facts-only notice and the city branch all carry the panel.
      expect((results.match(/\{otherSourcesPanel\}/g) ?? []).length).toBe(5); // ok list, hotel list, empty, facts-only and the Turna error branch (W.3);
    });

    it('W.2 SearchResults renders the panel under the list only when other-source state is present', async () => {
      const { SearchResults } = await import('../components/SearchResults');
      const FIXED = new Date(Date.UTC(2026, 8, 7, 12, 0, 0));
      const env = await runSourceSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, ['obilet'], { fetchPage: async () => ({ html: OBILET_BUS_PAGE, via: 'direct' as const, fetchedAt: '2026-09-07T11:59:00.000Z', latencyMs: 7, warnings: [] }), now: () => FIXED });
      const parsed = parseSearchEnvelope(JSON.parse(JSON.stringify(env)));
      const state: OtherSourcesState = { status: 'ok', envelope: parsed!.envelope, dropped: 0, receivedAt: FIXED.toISOString() };
      const noop = () => undefined;
      const withPanel = renderToStaticMarkup(React.createElement(SearchResults, { routes: [], searchState: BASE_STATE, isLiveScraping: false, onSelectRoute: noop, otherSources: state }));
      expect(withPanel).toContain('data-other-sources="ok"');
      expect(withPanel).toContain('data-source-section="obilet"');
      expect(withPanel).toContain('Yeni Aksaray Seyahat');
      expect(withPanel).toContain(OTHER_SOURCES_DISCLOSURE);
      const without = renderToStaticMarkup(React.createElement(SearchResults, { routes: [], searchState: BASE_STATE, isLiveScraping: false, onSelectRoute: noop }));
      expect(without).toNotContain('data-other-sources');
      const loading = renderToStaticMarkup(React.createElement(SearchResults, { routes: [], searchState: BASE_STATE, isLiveScraping: false, onSelectRoute: noop, otherSources: { status: 'loading' } }));
      expect(loading).toContain(OTHER_SOURCES_LOADING);
      // A ferry tab has no other source, so even a present state renders nothing.
      const ferry = renderToStaticMarkup(React.createElement(SearchResults, { routes: [], searchState: { ...BASE_STATE, transportType: 'feribot' }, isLiveScraping: false, onSelectRoute: noop, otherSources: state }));
      expect(ferry).toNotContain('data-other-sources');
    });

    it('W.3 when Turna fails (blocked, rate limited, upstream down) the other sources still render under the error notice', async () => {
      const { SearchResults } = await import('../components/SearchResults');
      const FIXED = new Date(Date.UTC(2026, 8, 7, 12, 0, 0));
      const env = await runSourceSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, ['obilet'], { fetchPage: async () => ({ html: OBILET_BUS_PAGE, via: 'direct' as const, fetchedAt: '2026-09-07T11:59:00.000Z', latencyMs: 7, warnings: [] }), now: () => FIXED });
      const parsed = parseSearchEnvelope(JSON.parse(JSON.stringify(env)));
      if (!parsed) throw new Error('fixture envelope invalid');
      const others: OtherSourcesState = { status: 'ok', envelope: parsed.envelope, dropped: 0, receivedAt: FIXED.toISOString() };
      const noop = () => undefined;
      const blocked: LiveSearchState = { status: 'error', query: { kind: 'bus', from: 'istanbul', to: 'ankara' }, httpStatus: 503, errorCode: 'blocked', message: 'Turna erişimi engelli', retryAfterSeconds: 120 };
      const html = renderToStaticMarkup(React.createElement(SearchResults, { routes: [], searchState: BASE_STATE, isLiveScraping: false, onSelectRoute: noop, live: blocked, otherSources: others }));
      expect(html).toContain('Hata kodu: blocked, HTTP 503');
      expect(html).toContain('data-other-sources="ok"');
      expect(html).toContain('data-source-section="obilet"');
      expect(html).toContain('3 sefer, en düşük 779 TL');
      // The comparison line has no Turna price to quote, so it names only the sources that answered (fewer than two: no line).
      expect(html).toNotContain('Kaynaklar arası en düşük fiyat');
      // The notice itself points to the panel, but only when some source actually answered with rows.
      expect(html).toContain(OTHER_SOURCES_BELOW_HINT);
      expect(hasOtherSourceRows(others)).toBeTruthy();
      const failedOnly: OtherSourcesState = { ...others, envelope: { ...others.envelope, results: [{ success: false, source: 'obilet', errorCode: 'blocked', error: 'obilet engelli' }] } };
      expect(hasOtherSourceRows(failedOnly)).toBeFalsy();
      const withFailure = renderToStaticMarkup(React.createElement(SearchResults, { routes: [], searchState: BASE_STATE, isLiveScraping: false, onSelectRoute: noop, live: blocked, otherSources: failedOnly }));
      expect(withFailure).toContain('data-source-failure="obilet"');
      expect(withFailure).toNotContain(OTHER_SOURCES_BELOW_HINT);
      expect(hasOtherSourceRows({ status: 'loading' })).toBeFalsy();
      expect(hasOtherSourceRows(undefined)).toBeFalsy();
      // While the other sources are still loading, the error notice is joined by the loading line, not by an empty panel.
      const loading = renderToStaticMarkup(React.createElement(SearchResults, { routes: [], searchState: BASE_STATE, isLiveScraping: false, onSelectRoute: noop, live: blocked, otherSources: { status: 'loading' } }));
      expect(loading).toContain('Hata kodu: blocked, HTTP 503');
      expect(loading).toContain(OTHER_SOURCES_LOADING);
      expect(loading).toNotContain(OTHER_SOURCES_BELOW_HINT);
      // Without other-source state the error branch stays exactly the notice.
      const bare = renderToStaticMarkup(React.createElement(SearchResults, { routes: [], searchState: BASE_STATE, isLiveScraping: false, onSelectRoute: noop, live: blocked }));
      expect(bare).toContain('Hata kodu: blocked, HTTP 503');
      expect(bare).toNotContain('data-other-sources');
      expect(bare).toNotContain(OTHER_SOURCES_BELOW_HINT);
    });

    it('W.4 while Turna is still loading, sources that already answered appear under the skeleton; a loading panel is not doubled', async () => {
      const { SearchResults } = await import('../components/SearchResults');
      const FIXED = new Date(Date.UTC(2026, 8, 7, 12, 0, 0));
      const env = await runSourceSearch({ kind: 'bus', from: 'istanbul', to: 'ankara' }, ['obilet'], { fetchPage: async () => ({ html: OBILET_BUS_PAGE, via: 'direct' as const, fetchedAt: '2026-09-07T11:59:00.000Z', latencyMs: 7, warnings: [] }), now: () => FIXED });
      const parsed = parseSearchEnvelope(JSON.parse(JSON.stringify(env)));
      if (!parsed) throw new Error('fixture envelope invalid');
      const others: OtherSourcesState = { status: 'ok', envelope: parsed.envelope, dropped: 0, receivedAt: FIXED.toISOString() };
      const noop = () => undefined;
      const loading: LiveSearchState = { status: 'loading', query: { kind: 'bus', from: 'istanbul', to: 'ankara' }, startedAt: FIXED.getTime() };
      const ready = renderToStaticMarkup(React.createElement(SearchResults, { routes: [], searchState: BASE_STATE, isLiveScraping: false, onSelectRoute: noop, live: loading, otherSources: others }));
      expect(ready).toContain('aria-label="Teklifler yükleniyor"');
      expect(ready).toContain('aria-busy="true"');
      expect(ready).toContain('data-other-sources="ok"');
      expect(ready).toContain('data-source-section="obilet"');
      expect(ready).toContain('3 sefer, en düşük 779 TL');
      // Both still loading: one skeleton, no second loading line.
      const both = renderToStaticMarkup(React.createElement(SearchResults, { routes: [], searchState: BASE_STATE, isLiveScraping: false, onSelectRoute: noop, live: loading, otherSources: { status: 'loading' } }));
      expect(both).toContain('aria-label="Teklifler yükleniyor"');
      expect(both).toNotContain('data-other-sources');
      expect(both).toNotContain(OTHER_SOURCES_LOADING);
      // No other-source state at all: skeleton only.
      const only = renderToStaticMarkup(React.createElement(SearchResults, { routes: [], searchState: BASE_STATE, isLiveScraping: false, onSelectRoute: noop, live: loading }));
      expect(only).toContain('aria-label="Teklifler yükleniyor"');
      expect(only).toNotContain('data-other-sources');
    });
  });

  describe('Sources M: per-source counters in the shared metrics', () => {
    it('M.1 handleSearchHttp records the request and one entry per source answer, reset clears them', async () => {
      const FIXED = new Date(Date.UTC(2026, 8, 7, 12, 0, 0));
      let tick = 0;
      const metrics = new TurnaMetrics(() => new Date(FIXED.getTime() + tick++ * 1000));
      expect(metrics.snapshot().bySource).toEqual({});
      const fetchPage = async (target: SourceTarget) => {
        if (target.source === 'biletall') throw new TurnaFetchError('blocked', 'biletall engelli', { retryAfterSeconds: 5 });
        return { html: OBILET_BUS_PAGE, via: 'cache' as const, fetchedAt: '2026-09-07T11:59:00.000Z', latencyMs: 3, warnings: [] as string[] };
      };
      const res = await handleSearchHttp({ method: 'get', url: new URL('http://localhost/api/search?kind=bus&from=istanbul&to=ankara') }, { fetchPage, now: () => FIXED, metrics });
      expect(res.status).toBe(200);
      let snap = metrics.snapshot();
      expect(snap.requests).toBe(1);
      expect(snap.byKind).toEqual({ 'search:bus': 1 });
      expect(snap.fetchedVia).toEqual({ search: 1 });
      const one = { samples: 1, p50: 3, p95: 3, max: 3 };
      const none = { samples: 0, p50: null, p95: null, max: null };
      expect(snap.bySource).toEqual({
        obilet: { ok: 1, failed: 0, byErrorCode: {}, fetchedVia: { cache: 1 }, latencyMs: one },
        biletall: { ok: 0, failed: 1, byErrorCode: { blocked: 1 }, fetchedVia: {}, latencyMs: none },
        enuygun: { ok: 1, failed: 0, byErrorCode: {}, fetchedVia: { cache: 1 }, latencyMs: one },
        flixbus: { ok: 1, failed: 0, byErrorCode: {}, fetchedVia: { cache: 1 }, latencyMs: one },
      });
      const bad = await handleSearchHttp({ method: 'get', url: new URL('http://localhost/api/search?kind=car') }, { fetchPage, now: () => FIXED, metrics });
      expect(bad.status).toBe(400);
      snap = metrics.snapshot();
      expect(snap.requests).toBe(2);
      expect(snap.failed).toBe(1);
      expect(snap.byErrorCode).toEqual({ invalid_query: 1 });
      expect(snap.byKind).toEqual({ 'search:bus': 1, search: 1 });
      // The stats body of /api/turna?stats=1 carries the same object (serialisable, no shared references).
      const wire = JSON.parse(JSON.stringify(snap)) as typeof snap;
      expect(wire.bySource.obilet.ok).toBe(1);
      metrics.recordSource({ source: 'obilet', ok: false, errorCode: 'route_not_found' });
      expect(metrics.snapshot().bySource.obilet).toEqual({ ok: 1, failed: 1, byErrorCode: { route_not_found: 1 }, fetchedVia: { cache: 1 }, latencyMs: one });
      metrics.reset();
      expect(metrics.snapshot().bySource).toEqual({});
      expect(metrics.snapshot().requests).toBe(0);
    });

    it('M.2 per-source latency ring summarises successful fetches only and keeps the last N samples', () => {
      const metrics = new TurnaMetrics(() => new Date(0), 3);
      for (const ms of [120, 80, 300]) metrics.recordSource({ source: 'enuygun', ok: true, fetchedVia: 'direct', latencyMs: ms });
      metrics.recordSource({ source: 'enuygun', ok: false, errorCode: 'timeout', latencyMs: 26_000 });
      expect(metrics.snapshot().bySource.enuygun.latencyMs).toEqual({ samples: 3, p50: 120, p95: 300, max: 300 });
      metrics.recordSource({ source: 'enuygun', ok: true, fetchedVia: 'cache', latencyMs: 2 });
      // Ring of 3: the oldest sample (120) falls out.
      expect(metrics.snapshot().bySource.enuygun.latencyMs).toEqual({ samples: 3, p50: 80, p95: 300, max: 300 });
      expect(metrics.snapshot().bySource.enuygun.fetchedVia).toEqual({ direct: 3, cache: 1 });
      expect(metrics.snapshot().bySource.enuygun.failed).toBe(1);
      metrics.recordSource({ source: 'obilet', ok: true, fetchedVia: 'direct' });
      expect(metrics.snapshot().bySource.obilet.latencyMs).toEqual({ samples: 0, p50: null, p95: null, max: null });
      // The process-wide latency ring is untouched by source samples.
      expect(metrics.snapshot().latencyMs).toEqual({ samples: 0, p50: null, p95: null, max: null });
    });
  });

  describe('Sources H: cross-source hotel matching', () => {
    const turnaHotel = (over: Partial<HotelOffer>): HotelOffer => ({
      kind: 'hotel', source: 'turna', id: over.id ?? 'turna000001', name: over.name ?? 'Akra Antalya', url: 'https://www.turna.com/otel/akra-antalya', slug: 'akra-antalya',
      image: null, images: [], locality: over.locality ?? 'Antalya Merkez, Muratpaşa, Antalya', district: over.district ?? 'Muratpaşa', city: 'Antalya', region: 'Akdeniz', country: 'TR',
      rating: 9.4, ratingBest: 10, ratingText: 'Harika', reviewCount: 1735, stars: 5, amenities: [], tags: [], breakfast: null, turnaId: null, ...over,
    });

    it('H.1 names are normalised conservatively: dashes suffixes, generic words and Turkish letters fold away', () => {
      expect(normalizeHotelName('Akra Kemer - All Inclusive')).toBe('akra kemer');
      expect(normalizeHotelName('Concorde De Luxe Resort Lara Antalya- Prive Ultra All Inclusive')).toBe('concorde de luxe resort lara antalya');
      expect(normalizeHotelName('Miracle Resort Hotel')).toBe('miracle resort');
      expect(normalizeHotelName('Şanlı Otel & Spa')).toBe('sanli spa');
      expect(normalizeHotelName('Bora Bora Butik Hotel (Antalya)')).toBe('bora bora butik');
      expect(normalizeHotelName('Hotel')).toBe('');
      expect(normalizeHotelName('Akra Antalya') === normalizeHotelName('Akra Kemer')).toBeFalsy();
    });

    it('H.2 matching needs an identical normalised name, compatible places and exactly one candidate per source', () => {
      const obiletHotels = parseHotels(OBILET_HOTEL_PAGE, 'obilet', 'https://www.obilet.com/otel/antalya-otelleri');
      const otelzHotels = parseOtelzHotels(OTELZ_HOTEL_PAGE, 'https://www.otelz.com/antalya-otelleri');
      const miracle = turnaHotel({ id: 'turna000002', name: 'Miracle Resort Hotel', district: 'Aksu', locality: 'Kundu, Aksu, Antalya' });
      const concorde = turnaHotel({ id: 'turna000003', name: 'Concorde De Luxe Resort Lara Antalya', district: 'Aksu', locality: 'Kundu, Aksu, Antalya' });
      const akra = turnaHotel({});
      const matches = matchHotelRatings([miracle, concorde, akra], [...obiletHotels, ...otelzHotels]);
      expect(matches.get('turna000002')).toEqual([{ source: 'obilet', url: 'https://www.obilet.com/otel/miracle-resort-hotel', rating: 8.8, ratingBest: 10, reviewCount: 18, stars: 5 }]);
      const conc = matches.get('turna000003');
      expect(conc?.map((r) => r.source)).toEqual(['otelz']);
      expect(conc?.[0].rating).toBe(9.6);
      expect(matches.has('turna000001')).toBeFalsy();
      // A contradicting place (another city, no shared token) blocks the match even with the same name; district
      // granularity differs between sites (Kundu vs Aksu vs Muratpaşa), so a shared city token is enough to stay compatible.
      const wrongPlace = turnaHotel({ id: 'turna000004', name: 'Miracle Resort Hotel', district: 'Bodrum', city: 'Muğla', region: 'Ege', locality: 'Bodrum, Muğla' });
      expect(placesCompatible(turnaHotel({ id: 'x', name: 'Miracle Resort Hotel', district: 'Muratpaşa', locality: 'Antalya Merkez, Muratpaşa, Antalya' }), obiletHotels[0])).toBeTruthy();
      expect(placesCompatible(wrongPlace, obiletHotels[0])).toBeFalsy();
      expect(matchHotelRatings([wrongPlace], obiletHotels).has('turna000004')).toBeFalsy();
      // Turna hotels without any place token are compatible with anything; two same-named candidates make the source ambiguous.
      const nowhere = turnaHotel({ id: 'turna000005', name: 'Miracle Resort Hotel', district: null, city: null, region: null, locality: '' });
      expect(placesCompatible(nowhere, obiletHotels[0])).toBeTruthy();
      const twin = { ...obiletHotels[0], id: 'dup000000001', url: 'https://www.obilet.com/otel/miracle-resort-hotel-2' };
      expect(matchHotelRatings([nowhere], [...obiletHotels, twin]).has('turna000005')).toBeFalsy();
      expect(ratingRefLabel({ source: 'obilet', url: 'x', rating: 8.8, ratingBest: 10, reviewCount: 18, stars: 5 })).toBe('8,8/10 (18 yorum)');
      expect(ratingRefLabel({ source: 'obilet', url: 'x', rating: 9, ratingBest: 10, reviewCount: null, stars: null })).toBe('9/10');
      expect(ratingRefLabel({ source: 'obilet', url: 'x', rating: null, ratingBest: 10, reviewCount: 3, stars: null })).toBe(null);
    });

    it('H.4 enuygun hotels join the rating comparison: district plus city tokens match Turna, other cities do not', () => {
      const enuygunHotels = parseEnuygunHotels(ENUYGUN_HOTEL_PAGE, 'https://www.enuygun.com/otel/bolge/antalya-481/');
      const obiletHotels = parseHotels(OBILET_HOTEL_PAGE, 'obilet', 'https://www.obilet.com/otel/antalya-otelleri');
      const otelzHotels = parseOtelzHotels(OTELZ_HOTEL_PAGE, 'https://www.otelz.com/antalya-otelleri');
      const concorde = turnaHotel({ id: 'turna000010', name: 'Concorde De Luxe Resort Lara Antalya', district: 'Aksu', locality: 'Kundu, Aksu, Antalya' });
      const refs = matchHotelRatings([concorde], [...obiletHotels, ...otelzHotels, ...enuygunHotels]).get('turna000010');
      expect(refs?.map((r) => r.source)).toEqual(['otelz', 'enuygun']);
      const enuygunRef = refs?.find((r) => r.source === 'enuygun');
      if (!enuygunRef) throw new Error('enuygun reference missing');
      expect(enuygunRef).toEqual({ source: 'enuygun', url: 'https://www.enuygun.com/otel/detay/concorde-de-luxe-resort-lara-antalya-prive-ultra-all-inclusive-218570/', rating: 9.2, ratingBest: 10, reviewCount: 37, stars: null });
      expect(ratingRefLabel(enuygunRef)).toBe('9,2/10 (37 yorum)');
      // A Turna hotel of the same name in another city shares no place token with "Serik, Antalya" and is not matched.
      const belcontiMugla = turnaHotel({ id: 'turna000011', name: 'Belconti Resort Hotel', district: 'Bodrum', city: 'Muğla', region: 'Ege', locality: 'Bodrum, Muğla' });
      expect(enuygunHotels[1].name).toBe('Belconti Resort Hotel');
      expect(placesCompatible(belcontiMugla, enuygunHotels[1])).toBeFalsy();
      expect(matchHotelRatings([belcontiMugla], enuygunHotels).has('turna000011')).toBeFalsy();
      // Same name and city but a different district label (Muratpaşa vs Serik) still matches on the shared city token.
      const belcontiAntalya = turnaHotel({ id: 'turna000012', name: 'Belconti Resort Hotel', district: 'Muratpaşa', locality: 'Antalya Merkez, Muratpaşa, Antalya' });
      expect(matchHotelRatings([belcontiAntalya], enuygunHotels).get('turna000012')?.[0].rating).toBe(8.2);
      // enuygun never contributes stars, so the star column stays null and no price ever enters the comparison.
      expect(enuygunHotels.every((h) => h.stars === null && !('price' in h))).toBeTruthy();
    });

    it('H.3 HotelResults prints the matched ratings with source links and stays silent without a match', async () => {
      const { HotelResults, OTHER_RATINGS_LABEL } = await import('../components/results/HotelResults');
      const obiletHotels = parseHotels(OBILET_HOTEL_PAGE, 'obilet', 'https://www.obilet.com/otel/antalya-otelleri');
      const miracle = turnaHotel({ id: 'turna000002', name: 'Miracle Resort Hotel', district: 'Aksu', locality: 'Kundu, Aksu, Antalya' });
      const akra = turnaHotel({});
      const result = { success: true as const, kind: 'hotel' as const, query: { kind: 'hotel' as const, city: 'antalya' }, routeKey: 'hotel:antalya', sourceUrl: 'https://www.turna.com/otel/antalya', pageTitle: null, fetchedVia: 'direct' as const, latencyMs: 1, scrapedAt: '2026-09-07T12:00:00.000Z', items: [miracle, akra], facts: { carriersCount: null, popularCarriers: [], cheapestWeekday: null, tripsPerWeek: null, tripsPerDay: null, departureHubs: [], arrivalHubs: [], shortestDurationMinutes: null, shortestDurationLabel: null, faq: [] }, stats: null, history: [], delta: null, warnings: [] };
      const html = renderToStaticMarkup(React.createElement(HotelResults, { items: [miracle, akra], result, otherRatings: matchHotelRatings([miracle, akra], obiletHotels) }));
      expect(html).toContain(OTHER_RATINGS_LABEL);
      expect(html).toContain('data-other-ratings="1"');
      expect(html).toContain('href="https://www.obilet.com/otel/miracle-resort-hotel"');
      expect(html).toContain('8,8/10 (18 yorum)');
      expect((html.match(/data-other-ratings=/g) ?? []).length).toBe(1);
      const silent = renderToStaticMarkup(React.createElement(HotelResults, { items: [akra], result: { ...result, items: [akra] } }));
      expect(silent).toNotContain(OTHER_RATINGS_LABEL);
      expect(silent).toNotContain('data-other-ratings');
    });

    it('H.5 two other sources for one Turna hotel print in source order, separated, each with its own link and new-tab note', async () => {
      const { HotelResults, OTHER_RATINGS_LABEL } = await import('../components/results/HotelResults');
      const otelzHotels = parseOtelzHotels(OTELZ_HOTEL_PAGE, 'https://www.otelz.com/antalya-otelleri');
      const enuygunHotels = parseEnuygunHotels(ENUYGUN_HOTEL_PAGE, 'https://www.enuygun.com/otel/bolge/antalya-481/');
      const concorde = turnaHotel({ id: 'turna000020', name: 'Concorde De Luxe Resort Lara Antalya', district: 'Aksu', locality: 'Kundu, Aksu, Antalya' });
      const result = { success: true as const, kind: 'hotel' as const, query: { kind: 'hotel' as const, city: 'antalya' }, routeKey: 'hotel:antalya', sourceUrl: 'https://www.turna.com/otel/antalya', pageTitle: null, fetchedVia: 'direct' as const, latencyMs: 1, scrapedAt: '2026-09-07T12:00:00.000Z', items: [concorde], facts: { carriersCount: null, popularCarriers: [], cheapestWeekday: null, tripsPerWeek: null, tripsPerDay: null, departureHubs: [], arrivalHubs: [], shortestDurationMinutes: null, shortestDurationLabel: null, faq: [] }, stats: null, history: [], delta: null, warnings: [] };
      const ratings = matchHotelRatings([concorde], [...otelzHotels, ...enuygunHotels]);
      expect(ratings.get('turna000020')?.map((r) => r.source)).toEqual(['otelz', 'enuygun']);
      const html = renderToStaticMarkup(React.createElement(HotelResults, { items: [concorde], result, otherRatings: ratings }));
      expect(html).toContain('data-other-ratings="2"');
      const labelAt = html.indexOf(OTHER_RATINGS_LABEL);
      const otelzAt = html.indexOf('>otelz.com<', labelAt);
      const enuygunAt = html.indexOf('>enuygun.com<', labelAt);
      expect(labelAt > -1 && otelzAt > labelAt && enuygunAt > otelzAt).toBeTruthy();
      // Separator between the two references, each reference linking to its own source page in a new tab.
      const between = html.slice(otelzAt, enuygunAt);
      expect(between).toContain(' · ');
      expect(between).toContain('9,6/10');
      expect(html.slice(enuygunAt)).toContain('9,2/10 (37 yorum)');
      expect(html).toContain('href="https://www.enuygun.com/otel/detay/concorde-de-luxe-resort-lara-antalya-prive-ultra-all-inclusive-218570/"');
      expect((html.slice(labelAt).match(/\(yeni sekmede açılır\)/g) ?? []).length >= 2).toBeTruthy();
      // No hotel price anywhere on the card: neither Turna nor the other sources publish one.
      expect(html).toNotContain(' TL<');
    });
  });
}
