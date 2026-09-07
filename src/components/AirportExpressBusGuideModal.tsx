import React, { useState } from 'react';
import {
  BileoClose,
  BileoBus,
  BileoPlane,
  BileoShieldCheck,
  BileoCheckCircle,
} from './icons';
import { sound } from '../utils/sound';
import { SampleDataNotice } from './common/SampleDataNotice';

interface AirportExpressBusGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface AirportShuttleService {
  id: string;
  airportName: string;
  airportCode: string;
  city: string;
  brand: string;
  routes: {
    lineName: string;
    destination: string;
    duration: string;
    frequency: string;
    priceTl: number;
    platform: string;
    paymentMethods: string[];
    intermediateStops: string[];
  }[];
}

const AIRPORT_SERVICES: AirportShuttleService[] = [
  {
    id: 'ist-havaist',
    airportName: 'İstanbul Havalimanı (IST)',
    airportCode: 'IST',
    city: 'İstanbul',
    brand: 'HAVAİST & İETT',
    routes: [
      {
        lineName: 'HVİST-16',
        destination: 'Taksim Meydanı (Gümüşsuyu & AKM)',
        duration: '90 dk',
        frequency: 'Her 30 dakikada bir (24 Saat)',
        priceTl: 240,
        platform: '-2 Katı, 16 Numaralı Peron',
        paymentMethods: ['Kredi Kartı', 'İstanbulkart', 'Online Bilet'],
        intermediateStops: ['4. Levent', 'Zincirlikuyu', 'Beşiktaş', 'Taksim'],
      },
      {
        lineName: 'HVİST-14',
        destination: 'Kadıköy (Rıhtım & Tepeüstü)',
        duration: '110 dk',
        frequency: 'Her 40 dakikada bir',
        priceTl: 260,
        platform: '-2 Katı, 14 Numaralı Peron',
        paymentMethods: ['Kredi Kartı', 'İstanbulkart'],
        intermediateStops: ['Kavacık', 'Yenisahra', 'Göztepe', 'Kadıköy'],
      },
      {
        lineName: 'HVİST-12',
        destination: 'Aksaray / Yenikapı (Marmaray)',
        duration: '80 dk',
        frequency: 'Her 25 dakikada bir',
        priceTl: 220,
        platform: '-2 Katı, 12 Numaralı Peron',
        paymentMethods: ['Kredi Kartı', 'İstanbulkart'],
        intermediateStops: ['Nurtepe', 'Ayvansaray', 'Ulubatlı', 'Yenikapı'],
      },
    ],
  },
  {
    id: 'saw-havabus',
    airportName: 'Sabiha Gökçen Havalimanı (SAW)',
    airportCode: 'SAW',
    city: 'İstanbul',
    brand: 'HAVABÜS & İETT Ekspres',
    routes: [
      {
        lineName: 'HAVABÜS-KAD',
        destination: 'Kadıköy Rıhtım (İskele Karşısı)',
        duration: '60 dk',
        frequency: 'Her 30 dakikada bir (03:30 - 01:00)',
        priceTl: 160,
        platform: 'Gelen Yolcu Çıkışı, 1. Peron',
        paymentMethods: ['Kredi Kartı', 'Nakit'],
        intermediateStops: ['Tem Bağlantısı', 'Yenisahra', 'Kadıköy'],
      },
      {
        lineName: 'HAVABÜS-TAK',
        destination: 'Taksim Gezi Parkı Karşısı',
        duration: '85 dk',
        frequency: 'Her 30 dakikada bir',
        priceTl: 180,
        platform: 'Gelen Yolcu Çıkışı, 2. Peron',
        paymentMethods: ['Kredi Kartı', 'Nakit'],
        intermediateStops: ['1. Köprü Bağlantısı', 'Levent', 'Taksim'],
      },
    ],
  },
  {
    id: 'esb-belkoair',
    airportName: 'Ankara Esenboğa Havalimanı (ESB)',
    airportCode: 'ESB',
    city: 'Ankara',
    brand: 'BELKOAIR & EGO 442',
    routes: [
      {
        lineName: 'EGO-442',
        destination: 'AŞTİ Şehirlerarası Otobüs Terminali',
        duration: '50 dk',
        frequency: 'Her 20 dakikada bir (24 Saat)',
        priceTl: 110,
        platform: 'İç & Dış Hatlar Çıkış Kapısı',
        paymentMethods: ['Ankarakart', 'Temassız Kredi Kartı'],
        intermediateStops: ['Pursaklar', 'Kızılay', 'Ankara Garı', 'AŞTİ'],
      },
    ],
  },
  {
    id: 'adb-havas',
    airportName: 'İzmir Adnan Menderes Havalimanı (ADB)',
    airportCode: 'ADB',
    city: 'İzmir',
    brand: 'HAVAŞ & İZBAN',
    routes: [
      {
        lineName: 'HAVAŞ-ALS',
        destination: 'Alsancak (Büyük Efes Oteli Önü)',
        duration: '45 dk',
        frequency: 'Uçak iniş saatlerine göre her 45 dk',
        priceTl: 140,
        platform: 'İç Hatlar Çıkışı Havaş Peronu',
        paymentMethods: ['Kredi Kartı', 'Nakit'],
        intermediateStops: ['Gaziemir', 'Karabağlar', 'Montrö', 'Alsancak'],
      },
      {
        lineName: 'HAVAŞ-CES',
        destination: 'Çeşme Otogarı & Alaçatı',
        duration: '80 dk',
        frequency: 'Günde 8 sefer (Yaz sezonu yoğun)',
        priceTl: 280,
        platform: 'Havaş Dış Hatlar Peronu',
        paymentMethods: ['Kredi Kartı', 'Nakit'],
        intermediateStops: ['Urla Gişeleri', 'Alaçatı Terminali', 'Çeşme'],
      },
    ],
  },
  {
    id: 'ayt-havas',
    airportName: 'Antalya Havalimanı (AYT)',
    airportCode: 'AYT',
    city: 'Antalya',
    brand: 'HAVAŞ & Antray',
    routes: [
      {
        lineName: 'HAVAŞ-OTG',
        destination: 'Antalya Şehirlerarası Otogarı (Kepez)',
        duration: '45 dk',
        frequency: 'Her saat başı',
        priceTl: 130,
        platform: 'İç Hatlar Terminali Çıkışı',
        paymentMethods: ['Kredi Kartı', 'Nakit', 'Antalyakart'],
        intermediateStops: ['Muratpaşa', 'Toptancı Hal', 'Çallı', 'Otogar'],
      },
    ],
  },
];

export const AirportExpressBusGuideModal: React.FC<AirportExpressBusGuideModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedAirportId, setSelectedAirportId] = useState<string>('ist-havaist');

  if (!isOpen) return null;

  const currentAirport = AIRPORT_SERVICES.find((a) => a.id === selectedAirportId) || AIRPORT_SERVICES[0];

  const handleCopyRoute = (lineName: string, destination: string, price: number) => {
    sound.playSuccess();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `${currentAirport.airportName} — ${lineName} ${destination} Servisi\nÜcret: ${price} TL\nPeron: ${currentAirport.brand}`
      );
    }
    if (onShowToast) {
      onShowToast(
        'Hat Bilgisi Kopyalandı',
        `${lineName} servis detayları panoya kopyalandı.`,
        'success'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-900 flex items-center justify-center border border-teal-200">
              <BileoBus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Havalimanı Servis & Transfer Rehberi (örnek)</h3>
              <p className="text-xs text-charcoal-muted font-medium">HAVAİST, HAVABÜS, HAVAŞ ve belediye ekspres hatları, peronlar ve temsili tarife örnekleri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        <SampleDataNotice />

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Airport Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {AIRPORT_SERVICES.map((apt) => (
              <button
                key={apt.id}
                type="button"
                onClick={() => { sound.playTick(); setSelectedAirportId(apt.id); }}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border shadow-2xs ${
                  selectedAirportId === apt.id
                    ? 'bg-teal-900 text-white border-teal-900 shadow-soft'
                    : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                }`}
              >
                <BileoPlane className="w-3.5 h-3.5" />
                <span>{apt.airportName}</span>
              </button>
            ))}
          </div>

          {/* Active Airport Banner */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-teal-900 uppercase tracking-wider">{currentAirport.city}</span>
                <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-black">{currentAirport.brand}</span>
              </div>
              <h4 className="text-base font-black text-charcoal font-display mt-0.5">{currentAirport.airportName}</h4>
            </div>
            <div className="flex items-center gap-2 text-xs text-charcoal-muted font-medium">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Temsili tarife; bagaj kuralları için taşıyıcının güncel duyurularına bakın</span>
            </div>
          </div>

          {/* Routes List */}
          <div className="space-y-3">
            <label className="text-xs font-black text-charcoal uppercase tracking-wider block">
              Mevcut Ekspres Servis Hatları & Güzergahlar ({currentAirport.routes.length} Hat)
            </label>

            <div className="grid grid-cols-1 gap-3">
              {currentAirport.routes.map((rt, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E1D5] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-teal-900 text-white text-xs font-mono font-black">
                        {rt.lineName}
                      </span>
                      <h5 className="text-sm font-black text-charcoal">{rt.destination}</h5>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-charcoal-muted block">Kişi Başı Ücret</span>
                        <span className="text-sm font-black text-teal-900 font-mono">{rt.priceTl} ₺</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyRoute(rt.lineName, rt.destination, rt.priceTl)}
                        className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-cream-200 text-charcoal text-xs font-bold transition-colors cursor-pointer border border-[#E8E1D5]"
                      >
                        Kopyala
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
                      <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Süre & Sefer Sıklığı</span>
                      <span className="font-black text-charcoal">{rt.duration}</span> • <span className="font-medium text-charcoal-muted">{rt.frequency}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
                      <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Terminal Peron Yeri</span>
                      <span className="font-bold text-teal-950">{rt.platform}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5]">
                      <span className="text-[10px] font-bold text-charcoal-muted uppercase block">Geçerli Ödeme Yöntemleri</span>
                      <span className="font-bold text-emerald-800">{rt.paymentMethods.join(' • ')}</span>
                    </div>
                  </div>

                  {/* Intermediate Stops */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="text-[10px] font-bold text-charcoal-muted mr-1">Ara Duraklar:</span>
                    {rt.intermediateStops.map((stop, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 rounded-md bg-cream-100 border border-[#E8E1D5] text-[11px] font-medium text-charcoal">
                        {stop}
                      </span>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Footer Guidelines */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium text-amber-950">
            <div className="flex items-center gap-2">
              <BileoCheckCircle className="w-4 h-4 text-amber-800 flex-shrink-0" />
              <span>Yoğun uçuş saatlerinde (özellikle sabah 06:00-09:00 ve akşam 18:00-21:00) seferlere 15 dakika erken gelmeniz önerilir.</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white hover:bg-cream-100 text-charcoal font-black text-xs transition-colors cursor-pointer border border-amber-300 flex-shrink-0"
            >
              Kapat
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
