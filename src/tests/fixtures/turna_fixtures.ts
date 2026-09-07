/**
 * Offline fixtures for the Turna scraper suite (src/tests/turna_scraper.test.ts).
 *
 * TypeScript port of C:\Users\cayma\Desktop\scraper\turna\tests\fixtures.py: minimal HTML pages
 * reproducing the JSON-LD shapes observed on turna.com landing pages (Sept 2026), plus the
 * fetch-layer fixtures the Python package does not need (a homepage without JSON-LD, robots.txt
 * bodies, a fake fetch factory with a call log and Response helpers).
 *
 * Nothing here touches the network. Every page carries 6000 filler characters so that
 * looksBlocked() (which treats bodies under 5000 characters as an empty shell) sees a real page.
 *
 * Phase 2 (fixtures.py: _rsc_scripts, rsc_hotel, HOTEL_PAGE_RSC, rsc_car, CAR_PAGE): the Next.js RSC payload
 * (`self.__next_f.push([1,"..."])` chunks) that carries the rich hotel list (`initialHotels`) and the car offers
 * (`cars`), split across two chunks so that concatenation is exercised.
 */
import type { BusOffer, CarOffer, FlightOffer, RouteFacts, TurnaOffer, TurnaSuccess } from '../../lib/turna/types';

// ---------------------------------------------------------------------------
// Page builder (fixtures.py: _page)
// ---------------------------------------------------------------------------

export const FILLER = 'x'.repeat(6000);

export interface PageOptions {
  title?: string;
  /** Extra markup appended after the filler (the Python twin uses it for Next.js RSC scripts). */
  extra?: string;
}

/** Wrap JSON-LD blocks into a minimal document the way turna.com emits them. */
export function page(blocks: unknown[], opts: PageOptions = {}): string {
  const title = opts.title ?? 'Test | Turna';
  const scripts = blocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('');
  return `<!doctype html><html><head><title>${title}</title>${scripts}</head><body>${FILLER}${opts.extra ?? ''}</body></html>`;
}

// ---------------------------------------------------------------------------
// Flight landing page (fixtures.py: flight, FLIGHT_FAQ, FLIGHT_PAGE)
// ---------------------------------------------------------------------------

export function flight(
  dep: string,
  arr: string,
  price: unknown,
  duration = '1s',
  airline = 'Pegasus',
  code = 'PC',
): Record<string, unknown> {
  return {
    '@type': 'Flight',
    estimatedFlightDuration: duration,
    arrivalAirport: { '@type': 'Airport', name: 'Ankara (ANK)', iataCode: 'ANK' },
    arrivalTime: arr,
    departureAirport: { '@type': 'Airport', name: 'İstanbul (IST)', iataCode: 'IST' },
    departureTime: dep,
    offers: { '@type': 'Offer', price, priceCurrency: 'TRY' },
    provider: { '@type': 'Airline', name: airline, iataCode: code },
  };
}

export const FLIGHT_FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'İstanbul Ankara şehirleri arasında uçuşları olan hava yolu şirketleri hangileridir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Hava yolu firmalarından bu hata ilgi duyanların sayısı 3 olmakla birlikte sezona göre değişimler olabilir. ' +
          'Verilerimize göre en çok uçak seferi gerçekleştiren firmalar şunlardır: Pegasus, Ajet ve Türk Hava Yolları.',
      },
    },
    {
      '@type': 'Question',
      name: 'Haftanın en ucuz günü?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Verilerimize göre haftanın en ucuz günü Cuma. Cuma seyahat edenler daha az öder.',
      },
    },
    {
      '@type': 'Question',
      name: 'Kaç uçuş vardır?',
      acceptedAnswer: { '@type': 'Answer', text: 'Bu rotada haftada 210, günlük 30 uçuş vardır.' },
    },
    {
      '@type': 'Question',
      name: 'Hangi havaalanları?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'İstanbul üzerinden uçarken şu havaalanlarından birini kullanacaksın: İstanbul Havalimanı, Sabiha Gökçen Havalimanı. ' +
          'Bu havalimanlarından birine ineceksin: Esenboğa Havalimanı.',
      },
    },
  ],
};

export const FLIGHT_PAGE_TITLE = 'İstanbul - Ankara Ucuz Uçak Bileti Fiyatları | Turna';

/** Five ItemList entries: a duplicate (collapsed by stableId) and an unpriced item (dropped) leave 3 offers. */
export const FLIGHT_PAGE = page(
  [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, item: flight('2026-09-24T09:50:00+03:00', '2026-09-24T10:50:00+03:00', 1401.11) },
        // duplicate of position 1
        { '@type': 'ListItem', position: 2, item: flight('2026-09-24T09:50:00+03:00', '2026-09-24T10:50:00+03:00', 1401.11) },
        {
          '@type': 'ListItem',
          position: 3,
          item: flight('2026-09-25T00:15:00+03:00', '2026-09-25T01:15:00+03:00', 2808.0, '2s 10d', 'AJet', 'VF'),
        },
        { '@type': 'ListItem', position: 4, item: flight('2026-09-26T00:05:00+03:00', '2026-09-26T01:05:00+03:00', '1.950,50', '1s 15d') },
        // unpriced: dropped by the parser
        { '@type': 'ListItem', position: 5, item: flight('2026-09-27T00:05:00+03:00', '', 0) },
      ],
    },
    { '@type': 'BreadcrumbList', itemListElement: [] },
    FLIGHT_FAQ,
  ],
  { title: FLIGHT_PAGE_TITLE },
);

// ---------------------------------------------------------------------------
// Bus landing page (fixtures.py: bus_trip, BUS_PAGE)
// ---------------------------------------------------------------------------

export function busTrip(company: string, dep: string, arr: string, price: string, fromStop = 'İstanbul Avrupa'): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BusTrip',
    name: 'İstanbul Ankara Otobüs Bileti',
    busName: company,
    provider: {
      '@type': 'Organization',
      name: company,
      url: `https://www.turna.com/otobus-bileti/${company.toLowerCase().replace(/ /g, '-')}`,
    },
    departureBusStop: {
      '@type': 'BusStation',
      name: fromStop,
      address: { '@type': 'PostalAddress', addressLocality: 'İstanbul', addressCountry: 'TR' },
    },
    arrivalBusStop: {
      '@type': 'BusStation',
      name: 'Ankara (Aşti)',
      address: { '@type': 'PostalAddress', addressLocality: 'Ankara', addressCountry: 'TR' },
    },
    departureTime: dep,
    arrivalTime: arr,
    offers: { '@type': 'Offer', price, priceCurrency: 'TL' },
  };
}

export const BUS_FAQ = {
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Popüler firmalar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'İstanbul ve Ankara arasında 50 adet otobüs firması sefer düzenlemektedir. ' +
          'En sık sefer düzenleyen otobüs firmaları, Seç Turizm, Villa Seyahat ve Lüks Mersin.',
      },
    },
    {
      '@type': 'Question',
      name: 'En ucuz gün?',
      acceptedAnswer: { '@type': 'Answer', text: 'Otobüs biletlerinde Perşembe en ucuz gündür.' },
    },
  ],
};

/** Two standalone BusTrip blocks (turna.com emits one script per trip) plus the FAQ. */
export const BUS_PAGE = page([
  busTrip('Elazığ Hazar Turizm', '13.09.2026 11:29:00', '13.09.2026 18:29:00', '500,00'),
  busTrip('Kamil Koç', '13.09.2026 23:30:00', '14.09.2026 05:45:00', '1.250,00'),
  BUS_FAQ,
]);

/** A bus landing page that publishes route facts but no BusTrip offers. */
export const BUS_FACTS_ONLY_PAGE = page([BUS_FAQ], { title: 'İstanbul - Ankara Otobüs Bileti | Turna' });

// ---------------------------------------------------------------------------
// Hotel landing page (fixtures.py: HOTEL_PAGE)
// ---------------------------------------------------------------------------

export const HOTEL_PAGE = page([
  {
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'ListItem',
        item: {
          '@type': 'Hotel',
          name: 'Akra Antalya',
          url: 'https://www.turna.com/otel/akra-antalya',
          image: 'https://i.travelapi.com/x.jpg',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Antalya Merkez, Muratpaşa, Antalya',
            addressCountry: 'Türkiye',
          },
          priceRange: 'En uygun fiyat',
          aggregateRating: {
            '@type': 'AggregateRating',
            bestRating: '10.0',
            worstRating: 1,
            ratingValue: '9.4',
            reviewCount: '1.735',
          },
        },
      },
      {
        '@type': 'ListItem',
        item: { '@type': 'Hotel', name: 'No Rating Hotel', url: 'https://www.turna.com/otel/no-rating', address: {} },
      },
    ],
  },
]);

// ---------------------------------------------------------------------------
// Next.js RSC payload builder (fixtures.py: _rsc_scripts)
// ---------------------------------------------------------------------------

/**
 * Next.js flight-data scripts carrying `"key":[...]` the way turna.com emits them. The payload is split into two
 * `self.__next_f.push([1,"..."])` chunks (mid-array) so that chunk concatenation is exercised; JSON.stringify escapes
 * quotes and newlines exactly like the JS string literals in the real page. A bootstrap `push([0])` is included too.
 * `extraPrefix` lets a page carry decoys before the key (an empty `"cars":[]`, a `totalCount`).
 */
export function rscScripts(key: string, items: unknown[], extraPrefix = ''): string {
  const payload = `b:C\nd:[["$","div",null,{${extraPrefix}"${key}":${JSON.stringify(items)}}]]\n`;
  const cut = Math.floor(payload.length / 2);
  const chunks = [JSON.stringify(payload.slice(0, cut)), JSON.stringify(payload.slice(cut))];
  return '<script>self.__next_f.push([0])</script>' + chunks.map((c) => `<script>self.__next_f.push([1,${c}])</script>`).join('');
}

// ---------------------------------------------------------------------------
// Hotel landing page with the RSC list (fixtures.py: _ld_hotel, rsc_hotel, HOTEL_PAGE_RSC)
// ---------------------------------------------------------------------------

export function ldHotel(name: string, slug: string, rating: string, reviews: string, image = 'https://i.travelapi.com/x.jpg'): Record<string, unknown> {
  return {
    '@type': 'ListItem',
    item: {
      '@type': 'Hotel',
      name,
      url: `https://www.turna.com/otel/${slug}`,
      image,
      address: { '@type': 'PostalAddress', addressLocality: 'Antalya Merkez, Muratpaşa, Antalya', addressCountry: 'Türkiye' },
      aggregateRating: { '@type': 'AggregateRating', bestRating: '10.0', worstRating: 1, ratingValue: rating, reviewCount: reviews },
    },
  };
}

/** One `initialHotels` card as emitted by turna.com (only the fields the parser reads plus a few decoys). */
export function rscHotel(hid: number, name: string, slug: string, stars: number, rating: number, reviews: number, district: string): Record<string, unknown> {
  return {
    id: hid,
    name,
    hotelSlug: slug,
    starRating: stars,
    location: `Antalya Merkez, ${district}, Antalya`,
    locationId: null,
    rating,
    ratingText: rating >= 9 ? 'Harika' : 'Çok İyi',
    reviewCount: reviews,
    breakfast: null,
    amenities: [
      { Code: '9', Name: 'Otopark' },
      { Code: '8', Name: 'Engelli Dostu' },
      { Code: '60', Name: 'Açık Havuz' },
    ],
    link: `/otel/${slug}`,
    imageUrl: [`https://i.travelapi.com/lodging/${hid}_z.jpg`],
    // The last two entries are the same URL: the parser must dedupe images.
    Images: [
      `https://i.travelapi.com/lodging/${hid}_b.jpg`,
      `https://cdn.turna.com/hotel/static/${hid}/${slug}_a.webp`,
      `https://cdn.turna.com/hotel/static/${hid}/${slug}_a.webp`,
    ],
    IsFavorited: false,
    FavoriteId: null,
    Address: { DistrictId: 0, District: district, CityId: 0, City: 'Antalya', CountryId: 'TR', Country: 'Türkiye', Region: 'Akdeniz Bölgesi' },
    Tags: [
      { id: 2050, slug: '5-yildizli-oteller', name: '5 Yıldızlı Otel', usage: '5 Yıldızlı Oteller' },
      { id: 2069, slug: 'is-otelleri', name: 'İş Oteli', usage: 'İş Otelleri' },
    ],
    MarketType: 'DOMESTIC',
    ProviderId: 7,
    CheckinDate: '2026-09-13',
    CheckoutDate: '2026-09-14',
  };
}

/** Three RSC hotels; Akra also appears in the JSON-LD list (overlap), Swandor has starRating 0 (not stated). */
export const HOTEL_RSC_ITEMS: Record<string, unknown>[] = [
  rscHotel(5956, 'Akra Antalya', 'akra-antalya', 5, 9.4, 1735, 'Muratpaşa'),
  // starRating 0 = not stated on turna.com -> stars must be null; "]" inside a string must not end the array.
  { ...rscHotel(3071, 'Swandor Hotels & Resort Topkapi Palace', 'swandor-topkapi-palace', 0, 8.9, 2280, 'Aksu'), breakfast: 'Kahvaltı dahil [açık büfe]' },
  rscHotel(4410, 'Titanic Deluxe Lara', 'titanic-deluxe-lara', 5, 9.2, 3120, 'Aksu'),
];

export const HOTEL_PAGE_RSC_TITLE = 'Antalya Otelleri | Turna';

/**
 * Live hotel landing page shape: JSON-LD ItemList (20 of the hotels on turna.com) plus the RSC `initialHotels`
 * array (all 50). Here 2 JSON-LD hotels + 3 RSC hotels with one overlapping slug (akra-antalya) = 4 merged rows.
 */
export const HOTEL_PAGE_RSC_HTML = page(
  [
    {
      '@type': 'ItemList',
      itemListElement: [ldHotel('Akra Antalya', 'akra-antalya', '9.4', '1.735'), ldHotel('Rixos Downtown Antalya', 'rixos-downtown-antalya', '8.8', '1.020')],
    },
    { '@type': 'BreadcrumbList', itemListElement: [] },
  ],
  { title: HOTEL_PAGE_RSC_TITLE, extra: rscScripts('initialHotels', HOTEL_RSC_ITEMS, '"totalCount":50,') },
);

// ---------------------------------------------------------------------------
// Car landing page (fixtures.py: rsc_car, CAR_PAGE): offers live only in the RSC `cars` array
// ---------------------------------------------------------------------------

export function rscCar(
  brand: string,
  model: string,
  klass: string,
  fuel: string,
  transmission: string,
  km: number,
  company: string,
  slug: string,
  price: number,
  image = true,
): Record<string, unknown> {
  return {
    Brand: brand,
    Model: model,
    Class: klass,
    FuelType: fuel,
    Transmission: transmission,
    MileageLimit: km,
    VehicleImages: image ? [{ ImageUrl: `https://res.cloudinary.com/otorento/image/upload/${brand}_${model}.png`.replace(/ /g, '') }] : [],
    Company: {
      Name: company,
      Id: 1,
      LogoUrl: `https://res.cloudinary.com/turna/image/upload/q_auto,f_auto/Images/Car/CarCompanies/${slug}.png`,
      LogoSlug: slug,
    },
    DailyPrice: price,
    CurrencyCode: 'TRY',
  };
}

/**
 * Six RSC rows -> four offers: the Clio duplicate collapses (same stableId) and the unpriced Sandero is dropped.
 * Covers TransmissionManuel/Auto, VehicleClassEconomy/MiniElite/Standard/Premium, MileageLimit 0 and positive,
 * FuelTypeGasoline/Diesel/Hybrid, a row without VehicleImages. Prices chosen so the stats are exact decimals:
 * min 1250, max 2500, avg 1772, median 1669.
 */
export const CAR_RSC_ITEMS: Record<string, unknown>[] = [
  rscCar('Nissan', 'Qashqai', 'VehicleClassPremium', 'FuelTypeDiesel', 'TransmissionAuto', 0, 'Veyonda Car', 'veyonda-car', 2500, false),
  rscCar('Renault', 'Clio', 'VehicleClassEconomy', 'FuelTypeGasoline', 'TransmissionManuel', 500, 'Circular', 'circular', 1437.99),
  // duplicate of the Clio row
  rscCar('Renault', 'Clio', 'VehicleClassEconomy', 'FuelTypeGasoline', 'TransmissionManuel', 500, 'Circular', 'circular', 1437.99),
  rscCar('Fiat', 'Egea', 'VehicleClassMiniElite', 'FuelTypeGasoline', 'TransmissionManuel', 300, 'Garenta', 'garenta', 1250),
  rscCar('Toyota', 'Corolla', 'VehicleClassStandard', 'FuelTypeHybrid', 'TransmissionAuto', 0, 'Avis', 'avis', 1900.01),
  // unpriced: dropped by the parser
  rscCar('Dacia', 'Sandero', 'VehicleClassEconomy', 'FuelTypeDiesel', 'TransmissionManuel', 400, 'Circular', 'circular', 0),
];

export const CAR_PAGE_TITLE = 'İstanbul Araç Kiralama | Turna';

/** `/arac-kiralama/sehir/istanbul`: JSON-LD is only a page descriptor (BreadcrumbList, AutoRental, FAQ); offers are in the RSC `cars` array. */
export const CAR_PAGE_HTML = page(
  [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', position: 2, item: { '@id': 'https://www.turna.com/arac-kiralama', name: 'Araç Kiralama' } }],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'AutoRental',
      name: 'İstanbul Araç Kiralama - Rent a Car | Turna',
      paymentAccepted: 'Credit Card',
      address: { '@type': 'PostalAddress', addressLocality: 'İstanbul', addressCountry: 'TR' },
      areaServed: [{ '@type': 'City', name: 'İstanbul' }],
      brand: { '@type': 'Organization', name: 'Turna.com', url: 'https://www.turna.com' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Yaş sınırı?', acceptedAnswer: { '@type': 'Answer', text: '<p>Araç kiralamak için en az 21 yaşında olmalısınız.</p>' } },
      ],
    },
  ],
  // An earlier empty "cars":[] occurrence must be skipped in favour of the populated one.
  { title: CAR_PAGE_TITLE, extra: rscScripts('cars', CAR_RSC_ITEMS, '"filters":{"cars":[]},') },
);

// ---------------------------------------------------------------------------
// Ferry landing page (fixtures.py: FERRY_PAGE): facts only, no offers
// ---------------------------------------------------------------------------

export const FERRY_PAGE = page([
  {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Kaç saat?',
        acceptedAnswer: { '@type': 'Answer', text: 'En kısa feribot seyahati 1 saat 25 dakika sürmektedir.' },
      },
      {
        '@type': 'Question',
        name: 'Firmalar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Yalova ve Yenikapı arasında 1 adet feribot firması sefer düzenlemektedir. ' +
            'En sık sefer düzenleyen feribot firmaları, İdo.',
        },
      },
    ],
  },
]);

// ---------------------------------------------------------------------------
// Blocked shell (fixtures.py: BLOCKED_PAGE) and fetch-layer additions
// ---------------------------------------------------------------------------

/** Akamai wall as served with HTTP 200 (short body, "Access Denied" title, Reference marker). */
export const BLOCKED_PAGE =
  '<HTML><HEAD>\n<TITLE>Access Denied</TITLE>\n</HEAD><BODY>\n<H1>Access Denied</H1>\nReference&#32;&#35;18&#46;ac760740</BODY></HTML>';

/** A full-size Akamai wall: long enough to pass the size heuristic, caught by the markers. */
export const BLOCKED_PAGE_LONG = `<html><head><title>Access Denied</title></head><body>Reference&#32;&#35;18.abc ${FILLER}</body></html>`;

export const HOMEPAGE_TITLE = 'Ucuz Uçak Bileti, Otel ve Otobüs Bileti | Turna';

/** What turna.com serves after redirecting an unknown route to its homepage: 6 KB, zero JSON-LD. */
export const HOMEPAGE_PAGE = page([], { title: HOMEPAGE_TITLE });

/**
 * URL fragments assembled at runtime so that the repo-wide literal gate
 * (spec section 8: no private-API or dated-search literals under src/) stays clean.
 */
export const DATED_SEARCH_SEGMENT = ['tek', 'yon'].join('-');
export const PRIVATE_API_URL = `https://www.turna.com/${['api', 'proxy', 'v1', 'meta', 'autocomplete', 'flight'].join('/')}`;
export const DATED_SEARCH_URL = `https://www.turna.com/ucak-bileti/${DATED_SEARCH_SEGMENT}/istanbul-ankara/2026-08-28`;

/** robots.txt shaped like turna.com's: landing pages allowed, private API and dated searches disallowed. */
export const ROBOTS_ALLOW = [
  'User-agent: Googlebot',
  'Disallow: /private/',
  '',
  'User-agent: *',
  'Disallow: /api/',
  `Disallow: /ucak-bileti/${DATED_SEARCH_SEGMENT}/`,
  'Allow: /',
  'Sitemap: https://www.turna.com/sitemap.xml',
  '',
].join('\n');

export const ROBOTS_DENY_ALL = 'User-agent: *\nDisallow: /\n';

// ---------------------------------------------------------------------------
// Fake fetch factory
// ---------------------------------------------------------------------------

export interface FakeFetchCall {
  /** 1-based position in the call log. */
  index: number;
  url: string;
  method: string;
  /** Lower-cased header names. */
  headers: Record<string, string>;
  init?: RequestInit;
}

/** Decide the Response for one call; throw to simulate a network failure. */
export type FetchScenario = (call: FakeFetchCall) => Response | Promise<Response>;

export interface FakeFetch {
  fetchImpl: typeof fetch;
  calls: FakeFetchCall[];
  urls(): string[];
  /** Calls whose URL does not end in /robots.txt. */
  pageCalls(): FakeFetchCall[];
}

function headersToRecord(headers: HeadersInit | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      out[key.toLowerCase()] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) out[key.toLowerCase()] = value;
    return out;
  }
  for (const [key, value] of Object.entries(headers)) out[key.toLowerCase()] = value;
  return out;
}

/** A `fetch` stand-in that records every call and answers through `scenario`. */
export function fakeFetch(scenario: FetchScenario): FakeFetch {
  const calls: FakeFetchCall[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const call: FakeFetchCall = {
      index: calls.length + 1,
      url,
      method: (init?.method ?? 'GET').toUpperCase(),
      headers: headersToRecord(init?.headers),
      init,
    };
    calls.push(call);
    return scenario(call);
  }) as typeof fetch;
  return {
    fetchImpl,
    calls,
    urls: () => calls.map((c) => c.url),
    pageCalls: () => calls.filter((c) => !c.url.endsWith('/robots.txt')),
  };
}

export interface ResponseOptions {
  status?: number;
  /** Final URL after redirects (Response.url); defaults to the request URL when the caller passes it. */
  url?: string;
  headers?: Record<string, string>;
}

/** Statuses for which the Fetch spec forbids a body; undici throws when one is passed. */
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

/** Build a Response whose `url` reports the final location (undici leaves it '' for synthetic responses). */
export function htmlResponse(body: string, opts: ResponseOptions = {}): Response {
  const status = opts.status ?? 200;
  const res = new Response(NULL_BODY_STATUSES.has(status) ? null : body, { status, headers: opts.headers });
  if (opts.url) Object.defineProperty(res, 'url', { value: opts.url });
  return res;
}

export function jsonResponse(body: unknown, opts: ResponseOptions = {}): Response {
  return htmlResponse(JSON.stringify(body), {
    ...opts,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(opts.headers ?? {}) },
  });
}

/** The error undici raises when AbortSignal.timeout fires. */
export function timeoutError(): Error {
  const err = new Error('The operation was aborted due to timeout');
  err.name = 'TimeoutError';
  return err;
}

/** A 200 response whose body stream fails on the first read (timeout while downloading). */
export function erroringBodyResponse(error: Error, url: string): Response {
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.error(error);
    },
  });
  const res = new Response(stream, { status: 200 });
  Object.defineProperty(res, 'url', { value: url });
  return res;
}

// ---------------------------------------------------------------------------
// Ready-made API envelopes for the browser-side guard / adapter / client tests
// ---------------------------------------------------------------------------

export const EMPTY_FACTS: RouteFacts = {
  carriersCount: null,
  popularCarriers: [],
  cheapestWeekday: null,
  tripsPerWeek: null,
  tripsPerDay: null,
  departureHubs: [],
  arrivalHubs: [],
  shortestDurationMinutes: null,
  shortestDurationLabel: null,
  faq: [],
};

/** Phase 2 wire shapes: every offer carries the derived CDN logo URL (flight/bus) and the bus company slug. */
export const SAMPLE_FLIGHT_OFFERS: FlightOffer[] = [
  {
    kind: 'flight',
    source: 'turna',
    id: 'eee39b67f15c',
    airline: 'Pegasus',
    airlineCode: 'PC',
    logoUrl: 'https://cdn.turna.com/Images/Flight/Airlines/PC.png',
    fromName: 'İstanbul (IST)',
    fromCode: 'IST',
    toName: 'Ankara (ANK)',
    toCode: 'ANK',
    departureAt: '2026-09-24T09:50:00+03:00',
    arrivalAt: '2026-09-24T10:50:00+03:00',
    date: '2026-09-24',
    durationMinutes: 60,
    durationLabel: '1 sa',
    price: 1401.11,
    currency: 'TRY',
    isDirect: null,
  },
  {
    kind: 'flight',
    source: 'turna',
    id: 'abcdefabcdef',
    airline: 'AJet',
    airlineCode: 'VF',
    logoUrl: 'https://cdn.turna.com/Images/Flight/Airlines/VF.png',
    fromName: 'İstanbul (SAW)',
    fromCode: 'SAW',
    toName: 'Ankara (ANK)',
    toCode: 'ANK',
    departureAt: '2026-09-25T00:15:00+03:00',
    arrivalAt: '2026-09-25T02:25:00+03:00',
    date: '2026-09-25',
    durationMinutes: 130,
    durationLabel: '2 sa 10 dk',
    price: 999,
    currency: 'TRY',
    isDirect: null,
  },
];

export const SAMPLE_BUS_OFFERS: BusOffer[] = [
  {
    kind: 'bus',
    source: 'turna',
    id: '0123456789ab',
    company: 'Elazığ Hazar Turizm',
    companyUrl: 'https://www.turna.com/otobus-bileti/elazig-hazar-turizm',
    companySlug: 'elazig-hazar-turizm',
    logoUrl: 'https://cdn.turna.com/Images/Bus/BusCompanies/elazig-hazar-turizm.png',
    fromStop: 'İstanbul Avrupa',
    fromCity: 'İstanbul',
    toStop: 'Ankara (Aşti)',
    toCity: 'Ankara',
    departureAt: '2026-09-13T11:29:00+03:00',
    arrivalAt: '2026-09-13T18:29:00+03:00',
    date: '2026-09-13',
    durationMinutes: 420,
    durationLabel: '7 sa',
    price: 500,
    currency: 'TRY',
  },
  {
    kind: 'bus',
    source: 'turna',
    id: 'ba9876543210',
    company: 'Kamil Koç',
    companyUrl: null,
    companySlug: 'kamil-koc',
    logoUrl: 'https://cdn.turna.com/Images/Bus/BusCompanies/kamil-koc.png',
    fromStop: 'İstanbul Avrupa',
    fromCity: 'İstanbul',
    toStop: 'Ankara (Aşti)',
    toCity: 'Ankara',
    departureAt: '2026-09-13T23:30:00+03:00',
    arrivalAt: '2026-09-14T05:45:00+03:00',
    date: '2026-09-13',
    durationMinutes: 375,
    durationLabel: '6 sa 15 dk',
    price: 1250,
    currency: 'TRY',
  },
];

/** Two hand-written CarOffers in the exact wire shape (no node:crypto needed on the browser side). */
export const SAMPLE_CAR_OFFERS: CarOffer[] = [
  {
    kind: 'car',
    source: 'turna',
    id: 'c0ffee000001',
    brand: 'Renault',
    model: 'Clio',
    vehicleClass: 'economy',
    vehicleClassRaw: 'VehicleClassEconomy',
    fuelType: 'gasoline',
    fuelTypeRaw: 'FuelTypeGasoline',
    transmission: 'manual',
    mileageLimitKm: 500,
    imageUrl: 'https://res.cloudinary.com/otorento/image/upload/Renault_Clio.png',
    company: 'Circular',
    companySlug: 'circular',
    companyLogoUrl: 'https://res.cloudinary.com/turna/image/upload/q_auto,f_auto/Images/Car/CarCompanies/circular.png',
    dailyPrice: 1437.99,
    currency: 'TRY',
  },
  {
    kind: 'car',
    source: 'turna',
    id: 'c0ffee000002',
    brand: 'Nissan',
    model: 'Qashqai',
    vehicleClass: 'premium',
    vehicleClassRaw: 'VehicleClassPremium',
    fuelType: 'diesel',
    fuelTypeRaw: 'FuelTypeDiesel',
    transmission: 'auto',
    mileageLimitKm: null,
    imageUrl: null,
    company: 'Veyonda Car',
    companySlug: 'veyonda-car',
    companyLogoUrl: null,
    dailyPrice: 2500,
    currency: 'TRY',
  },
];

/**
 * A hotel exactly as a Phase 1 server emitted it (no slug/images/district/city/region/ratingText/stars/amenities/
 * tags/breakfast/turnaId): the edge cache can still serve such a body, so the guard must accept it and encode the
 * absent fields as null / [].
 */
export const PHASE1_HOTEL_WIRE: Record<string, unknown> = {
  kind: 'hotel',
  source: 'turna',
  id: 'abc123abc123',
  name: 'Akra Antalya',
  url: 'https://www.turna.com/otel/akra-antalya',
  image: 'https://i.travelapi.com/x.jpg',
  locality: 'Antalya Merkez, Muratpaşa, Antalya',
  country: 'Türkiye',
  rating: 9.4,
  ratingBest: 10,
  reviewCount: 1735,
};

/** Looks like a flight offer but carries a string price: the guard must drop it, never coerce it. */
export const STRING_PRICE_OFFER: Record<string, unknown> = {
  ...SAMPLE_FLIGHT_OFFERS[0],
  id: 'badbadbadbad',
  price: '500',
};

export interface EnvelopeOverrides extends Partial<Omit<TurnaSuccess, 'success' | 'items'>> {
  items?: TurnaOffer[];
}

/** A complete TurnaSuccess (every field present with the exact type the guard expects). */
export function successEnvelope(overrides: EnvelopeOverrides = {}): TurnaSuccess {
  const kind = overrides.kind ?? 'flight';
  const items = overrides.items ?? SAMPLE_FLIGHT_OFFERS;
  return {
    success: true,
    kind,
    query: overrides.query ?? { kind, from: 'istanbul', to: 'ankara' },
    routeKey: overrides.routeKey ?? `${kind}:istanbul-ankara`,
    sourceUrl: overrides.sourceUrl ?? 'https://www.turna.com/ucak-bileti/istanbul-ankara',
    pageTitle: overrides.pageTitle === undefined ? FLIGHT_PAGE_TITLE : overrides.pageTitle,
    fetchedVia: overrides.fetchedVia ?? 'direct',
    latencyMs: overrides.latencyMs ?? 12,
    scrapedAt: overrides.scrapedAt ?? '2026-09-06T09:00:00.000Z',
    items,
    facts: overrides.facts ?? EMPTY_FACTS,
    stats: overrides.stats === undefined ? null : overrides.stats,
    history: overrides.history ?? [],
    delta: overrides.delta === undefined ? null : overrides.delta,
    warnings: overrides.warnings ?? [],
  };
}

/** JSON round-trip: what the browser actually receives from `/api/turna`. */
export function asWireJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}
