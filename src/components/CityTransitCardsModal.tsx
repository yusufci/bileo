import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoCheck,
} from './icons';
import { sound } from '../utils/sound';

interface CityTransitCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info' | 'promo') => void;
}

interface CityCardItem {
  id: string;
  cityName: string;
  cardName: string;
  singleFare: string;
  transferFare: string;
  contactlessCreditCard: boolean;
  nfcTopup: boolean;
  keyRoutes: string[];
  airportLink: string;
  terminalLink: string;
  tip: string;
}

const CITY_CARDS: CityCardItem[] = [
  {
    id: 'istanbul',
    cityName: 'İstanbul',
    cardName: 'İstanbulkart & Dijital QR',
    singleFare: '20.00 ₺ (Tam) / 9.76 ₺ (Öğrenci)',
    transferFare: '1. Aktarma 14.32 ₺ / 2. Aktarma 10.90 ₺',
    contactlessCreditCard: true,
    nfcTopup: true,
    keyRoutes: [
      'Marmaray (Halkalı ↔ Gebze boğaz altı geçiş)',
      'M2 Yenikapı - Seyrantepe - Hacıosman Metrosu',
      'M11 Gayrettepe - İstanbul Havalimanı Hızlı Metrosu',
      'Metrobüs (Beylikdüzü ↔ Söğütlüçeşme)',
      'Şehir Hatları Boğaz & Adalar Vapurları',
    ],
    airportLink: 'M11 Hızlı Metrosu (İGA İstanbul Havalimanı) & M4 Metrosu (Sabiha Gökçen Havalimanı)',
    terminalLink: 'Esenler Otogarı (M1A/M1B durağı) & Alibeyköy Cep Otogarı (T5 Tramvay durağı)',
    tip: 'Marmaray ve Metrobüs binişlerinde çıkış turnikelerinde kartınızı mutlaka iade makinelerine okutarak mesafe iadenizi alın.',
  },
  {
    id: 'ankara',
    cityName: 'Ankara',
    cardName: 'Ankarakart & EGO Mobil',
    singleFare: '18.00 ₺ (Tam) / 9.00 ₺ (Öğrenci)',
    transferFare: '75 Dakika İçinde 7.00 ₺ (Maksimum 2 Aktarma)',
    contactlessCreditCard: true,
    nfcTopup: true,
    keyRoutes: [
      'Ankaray (AŞTİ Otogarı ↔ Dikimevi)',
      'Başkentray (Sincan ↔ Kayaş banliyö hattı, YHT Garı bağlantılı)',
      'M1-M2-M3-M4 Kızılay, Batıkent, Çayyolu ve Keçiören Metroları',
    ],
    airportLink: 'Esenboğa Havalimanı için 442 numaralı EGO Ekspres otobüsü (AŞTİ ve Kızılay kalkışlı)',
    terminalLink: 'AŞTİ Şehirlerarası Otobüs Terminali doğrudan Ankaray metro istasyonuna bağlıdır.',
    tip: 'AŞTİ’den merkeze veya ODTÜ/Hacettepe tarafına giderken Ankaray ile Kızılay aktarması yaparak trafiğe hiç takılmazsınız.',
  },
  {
    id: 'izmir',
    cityName: 'İzmir',
    cardName: 'İzmirim Kart',
    singleFare: '17.50 ₺ (Tam) / 8.75 ₺ (Öğrenci)',
    transferFare: '90 Dakika Aktarma Sistemi (1. Aktarma 8.75 ₺, 2. ve sonrası ücretsiz)',
    contactlessCreditCard: true,
    nfcTopup: true,
    keyRoutes: [
      'İZBAN Raylı Banliyö (Aliağa ↔ Selçuk / Havalimanı)',
      'İzmir Metrosu (Fahrettin Altay ↔ Evka-3)',
      'Konak & Karşıyaka Tramvay Hatları',
      'İZDENİZ Körfez Vapurları (Bostanlı, Karşıyaka, Konak, Alsancak)',
    ],
    airportLink: 'İZBAN doğrudan Adnan Menderes Havalimanı Terminali içine kadar girer.',
    terminalLink: 'İZOTAŞ Otogarından Bornova Metrosuna bağlanan 204 numaralı ekspres ESHOT otobüsü.',
    tip: 'İzmir’de 90 dakika aktarma kuralı geçerlidir; metro, tramvay, vapur ve ESHOT arasında aktarma avantajından yararlanın.',
  },
  {
    id: 'antalya',
    cityName: 'Antalya',
    cardName: 'Antalyakart',
    singleFare: '20.00 ₺ (Tam) / 10.00 ₺ (Öğrenci)',
    transferFare: '60 Dakika İçinde İndirimli Aktarma',
    contactlessCreditCard: true,
    nfcTopup: true,
    keyRoutes: [
      'Antray Tramvayı (Fatih ↔ Otogar ↔ Havalimanı ↔ EXPO)',
      'Nostaljik Tramvay (Işıklar ↔ Müze)',
      'Büyükşehir Belediye Otobüs Ağı (KL08 vb. sahil hatları)',
    ],
    airportLink: 'Antray Tramvayı doğrudan Antalya Havalimanı Dış & İç Hatlar terminaline bağlıdır.',
    terminalLink: 'Antalya Şehirlerarası Otogarı altındaki Antray istasyonuyla kentin tüm noktalarına ulaşabilirsiniz.',
    tip: 'Fiziksel karta ihtiyaç duymadan temassız kredi kartınızla tüm Antray ve belediye otobüslerine binebilirsiniz.',
  },
  {
    id: 'eskisehir',
    cityName: 'Eskişehir',
    cardName: 'Eskart & Estram',
    singleFare: '15.00 ₺ (Tam) / 7.50 ₺ (Öğrenci)',
    transferFare: '45 Dakika Aktarma İndirimi',
    contactlessCreditCard: true,
    nfcTopup: true,
    keyRoutes: [
      'Estram Tramvay Hattı (Otogar ↔ SSK / Osmangazi Üni / Şehir Hastanesi)',
      'Belediye Otobüs Ring Hatları',
    ],
    airportLink: 'Hasan Polatkan Havalimanı için otogardan kalkan ekspres servisler.',
    terminalLink: 'Eskişehir Otogarı ve YHT Hızlı Tren Garı doğrudan Estram tramvay hattına entegredir.',
    tip: 'YHT Garı’ndan indiğinizde sadece 50 metre yürüyerek tramvaya binebilir ve Odunpazarı veya Anadolu Üniversitesi’ne 10 dakikada varabilirsiniz.',
  },
];

export const CityTransitCardsModal: React.FC<CityTransitCardsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedCityId, setSelectedCityId] = useState<string>('istanbul');

  if (!isOpen) return null;

  const current = CITY_CARDS.find((c) => c.id === selectedCityId) || CITY_CARDS[0];

  const handleSelectCity = (id: string) => {
    sound.playTick();
    setSelectedCityId(id);
  };

  const handleTopupNFC = () => {
    sound.playSuccess();
    if (onShowToast) {
      onShowToast(
        'NFC Kart Bakiye Rehberi Açıldı',
        `${current.cardName} bakiye yükleme adımları ve temassız geçiş bilgisi sağlandı.`,
        'info'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200 text-lg font-black">
              💳
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Şehir İçi Toplu Taşıma & Ulaşım Kartları Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">Otogar, YHT Garı ve Havalimanından Şehir Merkezine Metro, Tramvay ve Kart Bilgileri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* City Selector Tabs */}
        <div className="px-6 py-3 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CITY_CARDS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelectCity(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedCityId === c.id
                  ? 'bg-emerald-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              📍 {c.cityName}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Card Overview Banner */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">
                {current.cityName} Ulaşım Kartı
              </span>
              <h4 className="text-lg font-black text-charcoal">{current.cardName}</h4>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {current.contactlessCreditCard && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black flex items-center gap-1">
                    <BileoCheck className="w-3.5 h-3.5" /> Temassız Kredi Kartı Geçerli
                  </span>
                )}
                {current.nfcTopup && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-black flex items-center gap-1">
                    <BileoCheck className="w-3.5 h-3.5" /> Telefonda NFC Bakiye Yükleme
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleTopupNFC}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs transition-colors cursor-pointer shadow-soft whitespace-nowrap"
            >
              NFC Bakiye Yükleme İpuçları
            </button>
          </div>

          {/* Fares & Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-cream-50 border border-[#E8E1D5] space-y-1.5 shadow-2xs">
              <span className="text-[10px] font-black text-charcoal-muted uppercase tracking-wider block">
                Tek Geçiş / Biniş Ücreti:
              </span>
              <p className="text-sm font-black text-charcoal">{current.singleFare}</p>
            </div>

            <div className="p-4 rounded-2xl bg-cream-50 border border-[#E8E1D5] space-y-1.5 shadow-2xs">
              <span className="text-[10px] font-black text-charcoal-muted uppercase tracking-wider block">
                Aktarma Kuralları:
              </span>
              <p className="text-xs font-bold text-emerald-800">{current.transferFare}</p>
            </div>
          </div>

          {/* Terminal & Airport Transit Connections */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] space-y-3 shadow-2xs">
            <h5 className="text-sm font-black text-charcoal font-display">
              🚉 Havalimanı & Otogar Doğrudan Entegrasyonları
            </h5>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] flex items-start gap-2.5">
                <span className="font-black text-base">✈️</span>
                <div>
                  <span className="font-black text-charcoal block">Havalimanı Bağlantısı:</span>
                  <p className="text-charcoal-muted font-medium mt-0.5">{current.airportLink}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] flex items-start gap-2.5">
                <span className="font-black text-base">🚌</span>
                <div>
                  <span className="font-black text-charcoal block">Otogar & Gar Bağlantısı:</span>
                  <p className="text-charcoal-muted font-medium mt-0.5">{current.terminalLink}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metro & Transit Routes */}
          <div className="space-y-2">
            <h5 className="text-xs font-black text-charcoal uppercase tracking-wider">
              🚇 Önemli Raylı Sistem & Vapur Hatları
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {current.keyRoutes.map((route, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-[#E8E1D5] text-xs font-bold text-charcoal flex items-center gap-2 shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>{route}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Insider Local Tip */}
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex items-start gap-2.5 shadow-2xs">
            <span className="text-lg flex-shrink-0 mt-0.5">💡</span>
            <div>
              <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block mb-0.5">
                ŞEHİR İÇİ SEYAHAT İPUCU
              </span>
              <p className="text-xs text-amber-950 font-semibold leading-relaxed">
                {current.tip}
              </p>
            </div>
          </div>

          {/* Safety & Compliance Badge */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center justify-between text-xs text-charcoal-muted font-medium">
            <div className="flex items-center gap-2">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Büyükşehir Belediyeleri ve UKOME resmi güncel tarife verileri baz alınmıştır.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
