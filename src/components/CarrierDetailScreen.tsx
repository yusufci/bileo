import React, { useState, useMemo, useEffect } from 'react';
import {
  BileoArrowRight,
  BileoStar,
  BileoBus,
  BileoPlane,
  BileoTrain,
  BileoFerry,
} from './icons';
import { RouteItem, TransportType } from '../types';
import { renderBrandSVG } from './PartnerLogosRibbon';
import { CompanyLogo } from './CompanyLogo';
import { POPULAR_ROUTES } from '../data/mockData';
import { parseBileoDurationMinutes } from '../lib/turna/format';

/** Numeric duration for sorting; rows without a parsable label sort last. */
const durationMinutesOf = (r: RouteItem): number =>
  r.durationMinutes ?? parseBileoDurationMinutes(r.duration) ?? Number.MAX_SAFE_INTEGER;

interface CarrierDetailScreenProps {
  carrierName: string;
  onClose?: () => void;
  onSelectRoute: (route: RouteItem) => void;
}

/**
 * Detect Transport Modality from Carrier Name
 */
export const getCarrierTransportType = (carrier: string): TransportType => {
  const c = carrier.toLowerCase();
  if (
    c.includes('hava') ||
    c.includes('airlines') ||
    c.includes('pegasus') ||
    c.includes('ajet') ||
    c.includes('sunexpress') ||
    c.includes('emirates') ||
    c.includes('qatar') ||
    c.includes('lufthansa') ||
    c.includes('klm') ||
    c.includes('air france') ||
    c.includes('british')
  ) {
    return 'ucak';
  }
  if (
    c.includes('tcdd') ||
    c.includes('yht') ||
    c.includes('tren') ||
    c.includes('başkentray') ||
    c.includes('marmaray') ||
    c.includes('ice') ||
    c.includes('tgv') ||
    c.includes('frecciarossa')
  ) {
    return 'tren';
  }
  if (
    c.includes('ido') ||
    c.includes('i̇do') ||
    c.includes('budo') ||
    c.includes('gestaş') ||
    c.includes('şehir hatları') ||
    c.includes('dentur') ||
    c.includes('turyol') ||
    c.includes('akgünler') ||
    c.includes('i̇zdeniz') ||
    c.includes('izdeniz')
  ) {
    return 'feribot';
  }
  return 'otobus';
};

/**
 * Generate Authentic Realistic Multi-Route Schedule for any Carrier
 */
export const generateCarrierRoutes = (carrier: string, transportType: TransportType): RouteItem[] => {
  const existingMatches = POPULAR_ROUTES.filter(
    (r) => r.company.toLowerCase().trim() === carrier.toLowerCase().trim()
  );

  if (existingMatches.length >= 6) {
    return existingMatches;
  }

  // Pre-configured route templates based on transport modality
  const templates: {
    from: string;
    fromTerminal: string;
    to: string;
    toTerminal: string;
    duration: string;
    vehicleType: string;
    basePrice: number;
    hours: string[];
  }[] = [];

  if (transportType === 'otobus') {
    templates.push(
      {
        from: 'İstanbul',
        fromTerminal: 'Esenler Otogarı / Alibeyköy',
        to: 'Ankara',
        toTerminal: 'AŞTİ Otobüs Terminali',
        duration: '5s 30dk',
        vehicleType: '2+1 VIP Travego Lounge',
        basePrice: 620,
        hours: ['07:30', '10:00', '13:30', '16:00', '19:30', '23:45'],
      },
      {
        from: 'İstanbul',
        fromTerminal: 'Harem / Alibeyköy Cep Otogarı',
        to: 'İzmir',
        toTerminal: 'İzmir Şehirlerarası Otogarı (İZOTAŞ)',
        duration: '5s 15dk',
        vehicleType: '2+1 VIP Tourliner Relax',
        basePrice: 690,
        hours: ['08:00', '11:30', '15:00', '18:30', '21:00', '23:59'],
      },
      {
        from: 'Ankara',
        fromTerminal: 'AŞTİ Terminali',
        to: 'İzmir',
        toTerminal: 'İZOTAŞ Otogarı',
        duration: '7s 45dk',
        vehicleType: '2+1 VIP Neoplan Tourliner',
        basePrice: 650,
        hours: ['09:00', '14:00', '22:30'],
      },
      {
        from: 'İstanbul',
        fromTerminal: 'Büyük İstanbul Otogarı',
        to: 'Antalya',
        toTerminal: 'Antalya Şehirlerarası Otogarı',
        duration: '9s 30dk',
        vehicleType: '2+1 VIP Mercedes Travego',
        basePrice: 780,
        hours: ['19:00', '21:30', '23:00'],
      },
      {
        from: 'Bursa',
        fromTerminal: 'Bursa Otogarı',
        to: 'İzmir',
        toTerminal: 'İzmir Otogarı (İZOTAŞ)',
        duration: '3s 45dk',
        vehicleType: '2+1 Rahat Hat',
        basePrice: 420,
        hours: ['08:30', '12:00', '16:30', '20:00'],
      },
      {
        from: 'İzmir',
        fromTerminal: 'İZOTAŞ Otogarı',
        to: 'Bodrum',
        toTerminal: 'Bodrum Otogarı',
        duration: '3s 30dk',
        vehicleType: '2+1 VIP Suite',
        basePrice: 380,
        hours: ['09:30', '13:00', '17:30'],
      }
    );
  } else if (transportType === 'ucak') {
    templates.push(
      {
        from: 'İstanbul',
        fromTerminal: 'İstanbul Havalimanı (IST)',
        to: 'Ankara',
        toTerminal: 'Esenboğa Havalimanı (ESB)',
        duration: '1s 05dk',
        vehicleType: 'Airbus A321neo / Boeing 737-800',
        basePrice: 1450,
        hours: ['06:45', '09:15', '12:30', '16:00', '19:45', '22:15'],
      },
      {
        from: 'İstanbul',
        fromTerminal: 'Sabiha Gökçen Havalimanı (SAW)',
        to: 'İzmir',
        toTerminal: 'Adnan Menderes Havalimanı (ADB)',
        duration: '1s 10dk',
        vehicleType: 'Airbus A320neo Direct',
        basePrice: 1350,
        hours: ['07:30', '11:00', '14:30', '18:15', '21:40'],
      },
      {
        from: 'İstanbul',
        fromTerminal: 'İstanbul Havalimanı (IST)',
        to: 'Antalya',
        toTerminal: 'Antalya Havalimanı (AYT)',
        duration: '1s 15dk',
        vehicleType: 'Boeing 787-9 Dreamliner',
        basePrice: 1650,
        hours: ['08:15', '13:45', '17:30', '20:50'],
      },
      {
        from: 'İstanbul',
        fromTerminal: 'İstanbul Havalimanı (IST)',
        to: 'Paris',
        toTerminal: 'Charles de Gaulle (CDG)',
        duration: '3s 45dk',
        vehicleType: 'Airbus A350-900 Widebody',
        basePrice: 4850,
        hours: ['10:15', '16:30'],
      }
    );
  } else if (transportType === 'tren') {
    templates.push(
      {
        from: 'İstanbul',
        fromTerminal: 'Söğütlüçeşme YHT Garı',
        to: 'Ankara',
        toTerminal: 'Ankara YHT Garı',
        duration: '4s 15dk',
        vehicleType: 'Yüksek Hızlı Tren (Siemens Velaro)',
        basePrice: 480,
        hours: ['06:10', '08:45', '11:20', '14:05', '17:30', '20:10'],
      },
      {
        from: 'Ankara',
        fromTerminal: 'Ankara YHT Garı',
        to: 'Konya',
        toTerminal: 'Konya YHT Garı',
        duration: '1s 45dk',
        vehicleType: 'YHT Hızlı Hat',
        basePrice: 260,
        hours: ['07:00', '10:30', '14:15', '18:00', '21:15'],
      },
      {
        from: 'İstanbul',
        fromTerminal: 'Söğütlüçeşme YHT Garı',
        to: 'Eskişehir',
        toTerminal: 'Eskişehir YHT Garı',
        duration: '2s 50dk',
        vehicleType: 'Yüksek Hızlı Tren',
        basePrice: 350,
        hours: ['07:15', '12:00', '16:45', '19:50'],
      }
    );
  } else {
    templates.push(
      {
        from: 'İstanbul',
        fromTerminal: 'Yenikapı Hızlı İDO İskelesi',
        to: 'Bursa',
        toTerminal: 'Güzelyalı / Mudanya İskelesi',
        duration: '1s 35dk',
        vehicleType: 'Hızlı Deniz Otobüsü (Katamaran)',
        basePrice: 320,
        hours: ['07:45', '10:30', '13:15', '16:00', '18:45', '21:30'],
      },
      {
        from: 'İstanbul',
        fromTerminal: 'Kadıköy İskelesi',
        to: 'Bursa',
        toTerminal: 'Mudanya BUDO İskelesi',
        duration: '1s 40dk',
        vehicleType: 'Yolcu Katamaranı',
        basePrice: 290,
        hours: ['08:30', '11:45', '15:15', '19:00'],
      }
    );
  }

  const generatedRoutes: RouteItem[] = [];

  templates.forEach((tmpl, tIdx) => {
    tmpl.hours.forEach((hour, hIdx) => {
      const id = `${transportType[0]}-${carrier.slice(0, 3).toLowerCase()}-${tIdx * 10 + hIdx + 101}`;
      const [h, m] = hour.split(':').map(Number);
      const durHours = parseInt(tmpl.duration, 10) || 5;
      const durMins = tmpl.duration.includes('dk') ? parseInt(tmpl.duration.split('s')[1], 10) || 30 : 0;
      
      const totalArrivalMin = h * 60 + m + durHours * 60 + durMins;
      const arrH = Math.floor((totalArrivalMin % 1440) / 60);
      const arrM = totalArrivalMin % 60;
      const arrivalTime = `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`;

      generatedRoutes.push({
        id,
        from: tmpl.from,
        fromTerminal: tmpl.fromTerminal,
        to: tmpl.to,
        toTerminal: tmpl.toTerminal,
        departureTime: hour,
        arrivalTime,
        duration: tmpl.duration,
        date: '24 Mayıs Cumartesi',
        price: tmpl.basePrice + (hIdx * 20),
        originalPrice: tmpl.basePrice + 100,
        company: carrier,
        transportType,
        vehicleType: tmpl.vehicleType,
        rating: 4.8,
        reviewCount: 1840,
        availableSeats: 12,
        features: ['220V Priz', 'Wi-Fi', 'Koltuk Ekranı'],
      });
    });
  });

  return [...existingMatches, ...generatedRoutes];
};

export const CarrierDetailScreen: React.FC<CarrierDetailScreenProps> = ({
  carrierName,
  onSelectRoute,
}) => {
  const transportType = useMemo(() => getCarrierTransportType(carrierName), [carrierName]);
  const carrierRoutes = useMemo(
    () => generateCarrierRoutes(carrierName, transportType),
    [carrierName, transportType]
  );

  const [fromCityFilter, setFromCityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'earliest' | 'cheapest' | 'fastest' | 'rating'>('earliest');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [carrierName]);

  // Distinct city departure points
  const departureCities = useMemo(() => {
    const set = new Set<string>();
    carrierRoutes.forEach((r) => set.add(r.from));
    return Array.from(set);
  }, [carrierRoutes]);

  const filteredRoutes = useMemo(() => {
    return carrierRoutes
      .filter((r) => {
        if (fromCityFilter !== 'all' && r.from !== fromCityFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'earliest') return a.departureTime.localeCompare(b.departureTime);
        if (sortBy === 'cheapest') return a.price - b.price;
        if (sortBy === 'rating') return (b.rating ?? -1) - (a.rating ?? -1);
        if (sortBy === 'fastest') return durationMinutesOf(a) - durationMinutesOf(b);
        return 0;
      });
  }, [carrierRoutes, fromCityFilter, sortBy]);

  const getTransportIcon = (type: TransportType) => {
    switch (type) {
      case 'otobus': return BileoBus;
      case 'ucak': return BileoPlane;
      case 'tren': return BileoTrain;
      case 'feribot': return BileoFerry;
    }
  };

  const Icon = getTransportIcon(transportType);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1B18] flex flex-col selection:bg-bordeaux-700 selection:text-white animate-fadeIn font-sans pb-20">
      
      {/* Main Content Flow */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* EN ÜSTTE ÇERÇEVESİZ VE KARTSIZ KOCAMAN FİRMA LOGOSU */}
        <div className="py-6 sm:py-10 flex flex-col items-center justify-center text-center space-y-5 select-none">
          {/* Kocaman Vektör Logo (Kutusu ve Çerçevesi Yok) */}
          <div className="flex items-center justify-center transform scale-150 sm:scale-[2.4] py-8 sm:py-10">
            {renderBrandSVG(carrierName)}
          </div>

          <p className="text-xs sm:text-sm text-charcoal-muted max-w-xl mx-auto leading-relaxed pt-1">
            {carrierName}, Türkiye'nin öncü taşımacılık standartlarına uygun modern araç filosu, 2+1 geniş koltuk dizilimi ve konfor standartlarıyla kesintisiz sefer hizmeti sunmaktadır.
          </p>

          {/* Fleet & Guarantee Badges Ribbon */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-[#1E1B18] pt-1">
            <div className="flex items-center gap-1.5 text-amber-500">
              <BileoStar className="w-4 h-4 fill-amber-500" />
              <span className="font-bold text-[#1E1B18]">4.8 / 5.0</span>
              <span className="text-charcoal-muted font-normal">(1.840+ Yolcu Puanı)</span>
            </div>
            <span className="text-[#E2DCD2]">•</span>
            <span className="text-charcoal">{carrierRoutes.length} Günlük Aktif Sefer</span>
            <span className="text-[#E2DCD2]">•</span>
            <span className="text-charcoal">30 KG Bagaj Hakkı</span>
            <span className="text-[#E2DCD2]">•</span>
            <span className="text-charcoal">220V Priz & Hızlı Wi-Fi</span>
          </div>
        </div>

        {/* SEFERLER FİLTRELEME VE LİSTELEME BÖLÜMÜ */}
        <div className="space-y-6">
          
          {/* Header & Filter Bar */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-bordeaux-700 font-display block mb-0.5">
                {carrierName} Sefer Programı
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1E1B18] tracking-tight">
                Tüm Güncel Seferler ({filteredRoutes.length} Sefer Listelendi)
              </h2>
            </div>

            {/* Departure City Filter Pills & Sort Select */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              
              {/* City Filter Pills */}
              <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFromCityFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    fromCityFilter === 'all'
                      ? 'bg-bordeaux-700 text-white shadow-xs'
                      : 'text-charcoal-muted hover:text-charcoal'
                  }`}
                >
                  Tüm Şehirler
                </button>
                {departureCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setFromCityFilter(city)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      fromCityFilter === city
                        ? 'bg-bordeaux-700 text-white shadow-xs'
                        : 'text-charcoal-muted hover:text-charcoal'
                    }`}
                  >
                    {city} Çıkışlı
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#FAF7F2] px-3.5 py-2 rounded-2xl text-xs font-semibold text-charcoal focus:outline-none cursor-pointer border border-[#E2DCD2]/40"
              >
                <option value="earliest">Kalkış Saati (En Erken)</option>
                <option value="cheapest">Fiyat (En Uygun)</option>
                <option value="fastest">Yolculuk Süresi (En Hızlı)</option>
                <option value="rating">Yolcu Puanı (En Yüksek)</option>
              </select>

            </div>
          </div>

          {/* Routes Cards List */}
          <div className="space-y-4">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-3xl p-5 sm:p-6 shadow-soft hover:shadow-soft-lg transition-all duration-200 border border-transparent hover:border-[#E2DCD2]/60 flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
              >
                {/* Left: Time, Route Timeline & Terminals */}
                <div className="flex-1 space-y-3">
                  
                  <div className="flex items-center gap-3">
                    <CompanyLogo company={route.company} transportType={route.transportType} size="sm" />
                    {route.vehicleType && (
                      <>
                        <span className="text-xs font-semibold text-[#1E1B18]">{route.vehicleType}</span>
                        <span className="text-charcoal-muted text-xs">•</span>
                      </>
                    )}
                    <span className="text-xs text-charcoal-muted font-normal">{route.date}</span>
                    {typeof route.availableSeats === 'number' && (
                      <>
                        <span className="text-charcoal-muted text-xs">•</span>
                        <span className="text-xs font-medium text-emerald-700">
                          {route.availableSeats} Koltuk Kaldı
                        </span>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 pt-1">
                    
                    {/* Departure */}
                    <div className="sm:col-span-4">
                      <div className="text-2xl font-bold text-[#1E1B18] font-display">
                        {route.departureTime}
                      </div>
                      <div className="text-sm font-semibold text-[#1E1B18] mt-0.5">
                        {route.from}
                      </div>
                      <div className="text-xs text-charcoal-muted truncate max-w-[220px]">
                        {route.fromTerminal}
                      </div>
                    </div>

                    {/* Duration Line */}
                    <div className="sm:col-span-4 flex flex-col items-center justify-center">
                      <span className="text-[11px] font-medium text-charcoal-muted mb-1">
                        {route.duration}
                      </span>
                      <div className="w-full flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-bordeaux-700" />
                        <span className="h-[1px] flex-1 bg-[#E2DCD2] border-t border-dashed" />
                        <Icon className="w-3.5 h-3.5 text-bordeaux-700 flex-shrink-0" />
                        <span className="h-[1px] flex-1 bg-[#E2DCD2] border-t border-dashed" />
                        <span className="h-1.5 w-1.5 rounded-full bg-bordeaux-700" />
                      </div>
                      <span className="text-[10px] text-[#1E1B18] font-medium mt-1">Direkt Sefer</span>
                    </div>

                    {/* Arrival */}
                    <div className="sm:col-span-4 sm:text-right">
                      <div className="text-2xl font-bold text-[#1E1B18] font-display">
                        {route.arrivalTime}
                      </div>
                      <div className="text-sm font-semibold text-[#1E1B18] mt-0.5">
                        {route.to}
                      </div>
                      <div className="text-xs text-charcoal-muted truncate max-w-[220px] sm:ml-auto">
                        {route.toTerminal}
                      </div>
                    </div>

                  </div>

                </div>

                {/* Right: Price & Seat Selection CTA */}
                <div className="lg:pl-6 lg:border-l lg:border-[#E2DCD2]/60 flex sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4">
                  
                  <div className="text-left lg:text-right">
                    {typeof route.originalPrice === 'number' && (
                      <span className="text-[11px] text-charcoal-muted line-through block">
                        {route.originalPrice} TL
                      </span>
                    )}
                    <div className="text-2xl sm:text-3xl font-bold text-[#1E1B18] font-display">
                      {route.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-base font-semibold">TL</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectRoute(route)}
                    className="px-6 py-3 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-900 text-white font-bold text-xs uppercase tracking-wider shadow-bordeaux hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <span>KOLTUK SEÇ</span>
                    <BileoArrowRight className="w-3.5 h-3.5" />
                  </button>

                </div>

              </div>
            ))}
          </div>

        </div>

      </main>

    </div>
  );
};
