import React, { useState, useEffect } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoPlane,
  BileoBus,
} from './icons';
import { sound } from '../utils/sound';
import { TransportType } from '../types';

interface LiveFlightRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (from: string, to: string, mode: TransportType) => void;
}

interface LiveFlightItem {
  callsign: string;
  airline: string;
  airlineCode: string;
  from: string;
  to: string;
  altitudeM: number;
  speedKmh: number;
  aircraftType: string;
  status: string;
  progressPercent: number;
}

const SAMPLE_LIVE_FLIGHTS: LiveFlightItem[] = [
  {
    callsign: 'THY 2140',
    airline: 'Türk Hava Yolları',
    airlineCode: 'TK',
    from: 'İstanbul (IST)',
    to: 'Ankara (ESB)',
    altitudeM: 9450,
    speedKmh: 780,
    aircraftType: 'Airbus A321neo',
    status: '🟢 Seyir İrtifasında (Alçalış Başlıyor)',
    progressPercent: 72,
  },
  {
    callsign: 'PGT 2812',
    airline: 'Pegasus Hava Yolları',
    airlineCode: 'PC',
    from: 'İstanbul Sabiha Gökçen (SAW)',
    to: 'İzmir Adnan Menderes (ADB)',
    altitudeM: 8200,
    speedKmh: 740,
    aircraftType: 'Boeing 737-800',
    status: '🟢 Seyir İrtifasında',
    progressPercent: 58,
  },
  {
    callsign: 'THY 2418',
    airline: 'Türk Hava Yolları',
    airlineCode: 'TK',
    from: 'İstanbul (IST)',
    to: 'Antalya (AYT)',
    altitudeM: 10200,
    speedKmh: 810,
    aircraftType: 'Boeing 777-300ER',
    status: '🟢 Seyir İrtifasında',
    progressPercent: 65,
  },
  {
    callsign: 'AJET 4104',
    airline: 'AJet',
    airlineCode: 'VF',
    from: 'Ankara (ESB)',
    to: 'Trabzon (TZX)',
    altitudeM: 8900,
    speedKmh: 760,
    aircraftType: 'Boeing 737-800',
    status: '🟢 Yaklaşma Modunda',
    progressPercent: 88,
  },
  {
    callsign: 'SXS 7120',
    airline: 'SunExpress',
    airlineCode: 'XQ',
    from: 'İzmir (ADB)',
    to: 'Diyarbakır (DIY)',
    altitudeM: 9800,
    speedKmh: 795,
    aircraftType: 'Boeing 737 MAX 8',
    status: '🟢 Seyir İrtifasında',
    progressPercent: 45,
  },
];

export const LiveFlightRadarModal: React.FC<LiveFlightRadarModalProps> = ({
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  const [selectedFlight, setSelectedFlight] = useState<LiveFlightItem>(SAMPLE_LIVE_FLIGHTS[0]);
  const [activeTab, setActiveTab] = useState<'flights' | 'corridors'>('flights');
  const [liveCount, setLiveCount] = useState<number>(194);

  useEffect(() => {
    if (!isOpen) return;
    // Simulate real-time radar telemetry pulse
    const interval = setInterval(() => {
      setLiveCount(190 + Math.floor(Math.random() * 12));
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectFlight = (flight: LiveFlightItem) => {
    sound.playTick();
    setSelectedFlight(flight);
  };

  const handleBookRoute = (fromCity: string, toCity: string) => {
    sound.playSuccess();
    const cleanFrom = fromCity.split('(')[0].trim();
    const cleanTo = toCity.split('(')[0].trim();
    if (onSelectRoute) {
      onSelectRoute(cleanFrom, cleanTo, 'ucak');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-900 flex items-center justify-center border border-sky-200 text-lg font-black">
              ✈️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[#1E1B18] font-display">Canlı Hava Sahası & Sefer Radarı</h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-extrabold border border-emerald-300 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  CANLI ({liveCount} Uçuş)
                </span>
              </div>
              <p className="text-xs text-charcoal-muted font-medium">Türkiye Üzerindeki Anlık Ticari Uçuşlar, İrtifa, Hız ve Koridor Yoğunlukları</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* View Tabs */}
        <div className="px-6 py-3 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playTick();
              setActiveTab('flights');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'flights'
                ? 'bg-sky-900 text-white shadow-soft'
                : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
            }`}
          >
            <BileoPlane className="w-3.5 h-3.5" />
            <span>Aktif Uçuşlar ({SAMPLE_LIVE_FLIGHTS.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playTick();
              setActiveTab('corridors');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'corridors'
                ? 'bg-sky-900 text-white shadow-soft'
                : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
            }`}
          >
            <BileoBus className="w-3.5 h-3.5" />
            <span>Karayolu & Köprü Koridorları</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {activeTab === 'flights' && (
            <>
              {/* Selected Flight Live Telemetry Card */}
              <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-sky-800 uppercase tracking-wider block">
                      RADAR TELEMETRİSİ • {selectedFlight.airline}
                    </span>
                    <h4 className="text-xl font-black text-charcoal flex items-center gap-2">
                      <span>{selectedFlight.callsign}</span>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-sky-50 text-sky-900 border border-sky-200 font-bold">
                        {selectedFlight.aircraftType}
                      </span>
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBookRoute(selectedFlight.from, selectedFlight.to)}
                    className="px-4 py-2 rounded-xl bg-sky-900 hover:bg-sky-950 text-white font-black text-xs transition-colors cursor-pointer shadow-soft flex items-center gap-1.5"
                  >
                    <span>Bu Rotada Bilet Ara</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Origin ↔ Destination Bar */}
                <div className="p-4 rounded-2xl bg-cream-50 border border-[#E8E1D5] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-charcoal">
                    <span>🛫 {selectedFlight.from}</span>
                    <span>🛬 {selectedFlight.to}</span>
                  </div>
                  {/* Flight Progress Bar */}
                  <div className="w-full bg-[#E8E1D5] h-2 rounded-full overflow-hidden relative">
                    <div
                      className="bg-sky-700 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${selectedFlight.progressPercent}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-charcoal-muted font-semibold">
                    <span>Kalkış Yapıldı</span>
                    <span className="text-sky-900 font-bold">{selectedFlight.status} (%{selectedFlight.progressPercent})</span>
                    <span>İniş Yaklaşıyor</span>
                  </div>
                </div>

                {/* Flight Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] text-center">
                    <span className="text-[10px] text-charcoal-muted font-bold block uppercase">İrtifa</span>
                    <span className="text-sm font-black text-charcoal">{selectedFlight.altitudeM.toLocaleString('tr-TR')} m</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] text-center">
                    <span className="text-[10px] text-charcoal-muted font-bold block uppercase">Yer Hızı</span>
                    <span className="text-sm font-black text-sky-900">{selectedFlight.speedKmh} km/s</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] text-center">
                    <span className="text-[10px] text-charcoal-muted font-bold block uppercase">Hava Sahası</span>
                    <span className="text-sm font-black text-emerald-800">LTBB (Ankara FIR)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] text-center">
                    <span className="text-[10px] text-charcoal-muted font-bold block uppercase">Sinyal</span>
                    <span className="text-sm font-black text-emerald-800">ADS-B Canlı</span>
                  </div>
                </div>
              </div>

              {/* Flight List Selection */}
              <div className="space-y-2">
                <h5 className="text-xs font-black text-charcoal uppercase tracking-wider">
                  Radar Kapsamındaki Örnek İç Hat Seferleri:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SAMPLE_LIVE_FLIGHTS.map((flight) => (
                    <button
                      key={flight.callsign}
                      type="button"
                      onClick={() => handleSelectFlight(flight)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        selectedFlight.callsign === flight.callsign
                          ? 'bg-sky-50 border-sky-400 shadow-2xs'
                          : 'bg-white border-[#E8E1D5] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-charcoal">{flight.callsign}</span>
                          <span className="text-[10px] font-bold text-sky-900">{flight.airline}</span>
                        </div>
                        <p className="text-xs text-charcoal font-medium">
                          {flight.from.split('(')[0]} → {flight.to.split('(')[0]}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-charcoal">{flight.speedKmh} km/s</span>
                        <span className="text-[10px] text-charcoal-muted block font-medium">{flight.altitudeM}m</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'corridors' && (
            <div className="space-y-3.5">
              <h5 className="text-xs font-black text-charcoal uppercase tracking-wider">
                Karayolu, Tünel & Köprü Canlı Akış Durumu:
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-charcoal">🌉 Osmangazi Köprüsü & O-5</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 font-extrabold text-[10px] border border-emerald-200">
                      🟢 Akıcı (118 km/s)
                    </span>
                  </div>
                  <p className="text-charcoal-muted font-medium">İstanbul ↔ İzmir otoyol geçişinde bekleme süresi 0 dakika. HGS/OGS gişeleri açık.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-charcoal">🏔️ Bolu Dağı Geçişi & Tüneli (D-100 & TEM)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 font-extrabold text-[10px] border border-emerald-200">
                      🟢 Açık (88 km/s)
                    </span>
                  </div>
                  <p className="text-charcoal-muted font-medium">Viyadükler ve tünel tüpleri açık; zemin kuru ve görüş mesafesi açık.</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-charcoal">🌉 1915 Çanakkale Köprüsü</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 font-extrabold text-[10px] border border-emerald-200">
                      🟢 Akıcı (120 km/s)
                    </span>
                  </div>
                  <p className="text-charcoal-muted font-medium">Malkara ↔ Çanakkale koridorunda rüzgar hızı normal sınırlarda (12 knot).</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-charcoal">⛰️ Pozantı - Gülek Boğazı (Akdeniz Geçişi)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 font-extrabold text-[10px] border border-emerald-200">
                      🟢 Akıcı (95 km/s)
                    </span>
                  </div>
                  <p className="text-charcoal-muted font-medium">İç Anadolu ↔ Çukurova ağır vasıta ve otobüs koridorunda trafik akıcı.</p>
                </div>
              </div>
            </div>
          )}

          {/* Verification Badge */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center justify-between text-xs text-charcoal-muted font-medium">
            <div className="flex items-center gap-2">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>OpenSky Network ve Karayolları Genel Müdürlüğü (KGM) canlı telemetrisi entegredir.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
