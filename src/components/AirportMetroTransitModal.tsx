import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
} from './icons';
import { sound } from '../utils/sound';
import { SampleDataNotice } from './common/SampleDataNotice';

interface AirportMetroTransitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TransitHubItem {
  id: string;
  name: string;
  city: string;
  metroLine: string;
  metroDuration: string;
  metroFare: string;
  shuttleName: string;
  shuttleDuration: string;
  shuttleFare: string;
  taxiDuration: string;
  taxiEstimatedFare: string;
  keyTransferTip: string;
}

const TRANSIT_HUBS: TransitHubItem[] = [
  {
    id: 'iga',
    name: 'İstanbul Havalimanı (İGA - IST)',
    city: 'İstanbul',
    metroLine: 'M11 Gayrettepe – Kağıthane – İstanbul Havalimanı',
    metroDuration: '24 Dakika (120 km/s Türkiye’nin En Hızlı Metrosu)',
    metroFare: '27.00 ₺ (İstanbulkart Geçerli)',
    shuttleName: 'HAVAİST Ekspres Otobüsleri (11 Farklı Güzergah)',
    shuttleDuration: '45 – 75 Dakika (Trafiğe Bağlı)',
    shuttleFare: '180.00 – 240.00 ₺',
    taxiDuration: '35 – 50 Dakika',
    taxiEstimatedFare: '900 – 1.300 ₺',
    keyTransferTip: 'Gayrettepe istasyonundan M2 Yenikapı-Hacıosman hattına 2 dakikada kapalı tünel aktarmasıyla Taksim ve Şişli’ye ulaşabilirsiniz.',
  },
  {
    id: 'saw',
    name: 'Sabiha Gökçen Havalimanı (SAW)',
    city: 'İstanbul',
    metroLine: 'M4 Kadıköy – Sabiha Gökçen Havalimanı Metrosu',
    metroDuration: '45 Dakika (Ayrılık Çeşmesi Marmaray Aktarmalı)',
    metroFare: '20.00 ₺ (İstanbulkart Geçerli)',
    shuttleName: 'HAVABUS Kadıköy & Taksim Servisleri',
    shuttleDuration: '40 – 60 Dakika',
    shuttleFare: '130.00 – 190.00 ₺',
    taxiDuration: '30 – 45 Dakika',
    taxiEstimatedFare: '700 – 1.100 ₺',
    keyTransferTip: 'Ayrılık Çeşmesi durağında inip Marmaray’a geçerek Avrupa Yakası Sirkeci ve Yenikapı’ya trafik derdi olmadan geçebilirsiniz.',
  },
  {
    id: 'esb',
    name: 'Ankara Esenboğa Havalimanı (ESB)',
    city: 'Ankara',
    metroLine: 'M4 Keçiören Metrosu Bağlantı Projesi (Servis Aktarmalı)',
    metroDuration: 'Planlanan Hat',
    metroFare: '21.00 ₺',
    shuttleName: '442 EGO Ekspres (Havalimanı – Kızılay – AŞTİ Otogar)',
    shuttleDuration: '45 Dakika',
    shuttleFare: '50.00 ₺ (Ankarakart & Temassız Kredi Kartı)',
    taxiDuration: '30 Dakika',
    taxiEstimatedFare: '650 – 900 ₺',
    keyTransferTip: '442 numaralı EGO otobüsü 24 saat kesintisiz çalışır ve hem Kızılay Meydanı’na hem de AŞTİ Şehirlerarası Otobüs Terminali’ne doğrudan gider.',
  },
  {
    id: 'adb',
    name: 'İzmir Adnan Menderes Havalimanı (ADB)',
    city: 'İzmir',
    metroLine: 'İZBAN Banliyö Treni (Havalimanı Terminal İçi Doğrudan İstasyon)',
    metroDuration: '25 Dakika (Alsancak / Halkapınar Aktarmasız)',
    metroFare: '24.00 ₺ (İzmirim Kart Geçerli)',
    shuttleName: 'HAVAŞ & 204 ESHOT (Bornova Metro Bağlantısı)',
    shuttleDuration: '35 Dakika',
    shuttleFare: '40.00 – 110.00 ₺',
    taxiDuration: '25 Dakika',
    taxiEstimatedFare: '550 – 800 ₺',
    keyTransferTip: 'Dış Hatlar ve İç Hatlar terminal çıkışından yürüyen merdivenle doğrudan İZBAN peronuna inebilir, Karşıyaka veya Alsancak’a doğrudan gidebilirsiniz.',
  },
  {
    id: 'ayt',
    name: 'Antalya Havalimanı (AYT)',
    city: 'Antalya',
    metroLine: 'Antray Tramvay Hattı (T1A Havalimanı – Meydan – Otogar – Fatih)',
    metroDuration: '35 Dakika (Şehir Merkezi & Otogar Doğrudan)',
    metroFare: '20.00 ₺ (Antalyakart & Temassız Kart)',
    shuttleName: 'HAVAŞ & 600 Belediye Otobüsü',
    shuttleDuration: '40 Dakika',
    shuttleFare: '35.00 – 95.00 ₺',
    taxiDuration: '20 Dakika',
    taxiEstimatedFare: '450 – 700 ₺',
    keyTransferTip: 'Tramvay doğrudan Antalya Şehirlerarası Otobüs Terminali’nin içine kadar gider; aktarmasız otogar geçişi için en ekonomik çözümdür.',
  },
];

export const AirportMetroTransitModal: React.FC<AirportMetroTransitModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedHubId, setSelectedHubId] = useState<string>('iga');

  if (!isOpen) return null;

  const current = TRANSIT_HUBS.find((h) => h.id === selectedHubId) || TRANSIT_HUBS[0];

  const handleSelectHub = (id: string) => {
    sound.playTick();
    setSelectedHubId(id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-900 flex items-center justify-center border border-teal-200 text-lg font-black">
              🚇
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Havalimanı & Terminal Şehir İçi Metro Rehberi (örnek)</h3>
              <p className="text-xs text-charcoal-muted font-medium">İGA, Sabiha Gökçen, Esenboğa, Adnan Menderes & Antalya Metro/Tramvay Hatları</p>
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

        {/* Airport Hub Tabs */}
        <div className="px-6 py-3 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {TRANSIT_HUBS.map((hub) => (
            <button
              key={hub.id}
              type="button"
              onClick={() => handleSelectHub(hub.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedHubId === hub.id
                  ? 'bg-teal-900 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              📍 {hub.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Selected Airport Header Banner */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-2xs space-y-1">
            <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest block">
              ŞEHİR İÇİ TOPLU TAŞIMA ENTEGRASYONU • {current.city.toUpperCase()}
            </span>
            <h4 className="text-lg font-black text-charcoal">{current.name}</h4>
          </div>

          {/* 3-Way Transit Mode Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            
            {/* Metro & Rail Option */}
            <div className="p-4 rounded-2xl bg-white border border-teal-200 space-y-3 shadow-2xs relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-base">🚇</span>
                <h5 className="font-black text-charcoal">Metro & Raylı Sistem</h5>
              </div>
              <p className="font-bold text-teal-950 text-xs">{current.metroLine}</p>
              <div className="pt-2 border-t border-teal-100 space-y-1 text-charcoal-muted">
                <p>⏱️ <strong>Süre:</strong> {current.metroDuration}</p>
                <p>💳 <strong>Ücret:</strong> {current.metroFare}</p>
              </div>
              <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-[10px] font-black border border-emerald-200">
                🟢 En Hızlı & Trafiksiz
              </span>
            </div>

            {/* Airport Shuttle Option */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🚐</span>
                <h5 className="font-black text-charcoal">Havalimanı Servisi</h5>
              </div>
              <p className="font-bold text-charcoal text-xs">{current.shuttleName}</p>
              <div className="pt-2 border-t border-[#E8E1D5] space-y-1 text-charcoal-muted">
                <p>⏱️ <strong>Süre:</strong> {current.shuttleDuration}</p>
                <p>💳 <strong>Ücret:</strong> {current.shuttleFare}</p>
              </div>
              <span className="inline-block px-2 py-0.5 rounded-md bg-cream-100 text-charcoal text-[10px] font-black border border-[#E8E1D5]">
                🧳 Doğrudan Bagajlı Ulaşım
              </span>
            </div>

            {/* Taxi & Ride Option */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🚕</span>
                <h5 className="font-black text-charcoal">Taksi & Özel Transfer</h5>
              </div>
              <p className="font-bold text-charcoal text-xs">Resmi Havalimanı Taksileri</p>
              <div className="pt-2 border-t border-[#E8E1D5] space-y-1 text-charcoal-muted">
                <p>⏱️ <strong>Süre:</strong> {current.taxiDuration}</p>
                <p>💳 <strong>Tahmini Fiyat:</strong> {current.taxiEstimatedFare}</p>
              </div>
              <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-black border border-amber-200">
                📍 Kapıya Teslim
              </span>
            </div>

          </div>

          {/* Local Expert Transfer Secret */}
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex items-start gap-2.5 shadow-2xs">
            <span className="text-lg flex-shrink-0 mt-0.5">💡</span>
            <div>
              <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block mb-0.5">
                ŞEHİR MERKEZİNE EN HIZLI AKILLI AKTARMA TAKTİĞİ
              </span>
              <p className="text-xs text-amber-950 font-semibold leading-relaxed">
                {current.keyTransferTip}
              </p>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center justify-between text-xs text-charcoal-muted font-medium">
            <div className="flex items-center gap-2">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Hat, süre ve ücretler temsili örneklerdir; güncel tarifeler için İBB Ulaşım, EGO, ESHOT ve UKOME duyurularına bakın.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
