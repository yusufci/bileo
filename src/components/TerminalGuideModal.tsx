import React, { useState } from 'react';
import {
  BileoClose,
  BileoMapPin,
  BileoBus,
  BileoPlane,
  BileoTrain,
  BileoFerry,
  BileoCheck,
} from './icons';

interface TerminalInfo {
  id: string;
  name: string;
  city: string;
  type: 'otobus' | 'ucak' | 'tren' | 'feribot';
  address: string;
  metroConnection: string;
  transitLines?: string[];
  amenities: string[];
  tips: string;
  gateInfo: string;
}

const TERMINALS_DATA: TerminalInfo[] = [
  {
    id: 'esenler',
    name: 'Büyük İstanbul Otogarı (Esenler)',
    city: 'İstanbul',
    type: 'otobus',
    address: 'Altıntepsi Mah., Bayrampaşa / İstanbul',
    metroConnection: 'M1A / M1B Otogar İstasyonu (Doğrudan Terminal İçi Çıkış)',
    transitLines: ['M1A Yenikapı - Atatürk Havalimanı', 'M1B Yenikapı - Kirazlı', 'İETT 83O / 76O'],
    amenities: ['24 Saat Emanet Ofisi', 'Mescit & Şadırvan', 'Ücretsiz Yolcu Servisleri', 'ATM & Banka Noktaları', 'Yeme-İçme Alanları'],
    tips: 'Kalkış saatinizden en az 45 dakika önce peronunuzda hazır bulunmanız ve servis kalkış saatlerini peron görevlisine teyit etmeniz önerilir.',
    gateInfo: 'Peronlar 1 - 168 (Alt & Üst Kat)',
  },
  {
    id: 'asti',
    name: 'AŞTİ Şehirlerarası Otobüs Terminali',
    city: 'Ankara',
    type: 'otobus',
    address: 'Beştepeler Mah., Mevlana Blv. Yenimahalle / Ankara',
    metroConnection: 'Ankaray AŞTİ İstasyonu (Tünel Bağlantılı Doğrudan Giriş)',
    transitLines: ['Ankaray A1 Dikimevi - AŞTİ', 'EGO 442 Havalimanı Otobüsü', 'Konya Yolu Minibüsleri'],
    amenities: ['Emanet Bagaj Hizmeti', 'Bebek Bakım Odası', 'Özel Yolcu Dinlenme Salonları', 'Taksi Durağı', 'Eczane'],
    tips: 'Kızılay ve Tunalı yönüne gidecek yolcular Ankaray hattını kullanarak 10 dakikada şehir merkezine ulaşabilir.',
    gateInfo: 'Peronlar 1 - 92',
  },
  {
    id: 'ist-airport',
    name: 'İstanbul Havalimanı (IST)',
    city: 'İstanbul',
    type: 'ucak',
    address: 'Tayakadın Mah., Arnavutköy / İstanbul',
    metroConnection: 'M11 Gayrettepe - İstanbul Havalimanı Metrosu',
    transitLines: ['M11 Gayrettepe - Kağıthane - Havalimanı', 'Havaist HVİST-14 / HVİST-9', 'İETT H-2 Mecidiyeköy'],
    amenities: ['Havaist Ekspres Otobüsleri', 'Hızlı Geçiş (Fast Track)', 'Duty Free & Dining', 'Ücretsiz Wi-Fi', 'VIP Lounge'],
    tips: 'İç hat uçuşları için uçuştan en az 2 saat, dış hat uçuşları için en az 3 saat önce havalimanında olunmalıdır.',
    gateInfo: 'Kapılar A, B, C, D, E, F, G',
  },
  {
    id: 'saw-airport',
    name: 'Sabiha Gökçen Havalimanı (SAW)',
    city: 'İstanbul',
    type: 'ucak',
    address: 'Sanayi Mah., Pendik / İstanbul',
    metroConnection: 'M4 Kadıköy - Sabiha Gökçen Havalimanı Metrosu',
    transitLines: ['M4 Kadıköy - Tavşantepe - Sabiha Gökçen', 'Havabüs Taksim & Kadıköy', 'İETT E-3 4. Levent'],
    amenities: ['Havabüs Otobüsleri', 'Plaza Lounge', 'Otopark & Vale', 'Kayıp Eşya Ofisi', 'Döviz Büroları'],
    tips: 'M4 metro hattı ile Kadıköy rıhtımdan 50 dakikada doğrudan havalimanı içine ulaşabilirsiniz.',
    gateInfo: 'İç & Dış Hatlar Kapıları 201 - 315',
  },
  {
    id: 'ankara-yht',
    name: 'Ankara YHT Garı & Yaşam Merkezi',
    city: 'Ankara',
    type: 'tren',
    address: 'Celal Bayar Blv., Altındağ / Ankara',
    metroConnection: 'M4 Keçiören - AKM Metrosu & Ankaray Maltepe İstasyonu',
    transitLines: ['Başkentray Sincan - Kayaş', 'M4 Kızılay - Gar - Keçiören', 'Ankaray Maltepe Tüneli'],
    amenities: ['VIP Lounge', 'Alışveriş & Kafe Alanları', 'Kapalı Otopark', 'TCDD Danışma & Bilet Gişeleri'],
    tips: 'Yüksek Hızlı Tren kapıları kalkıştan 5 dakika önce otomatik kapanmaktadır; peronda vaktinde bulunulmalıdır.',
    gateInfo: 'YHT Peronları 1 - 6',
  },
  {
    id: 'yenikapi-ido',
    name: 'Yenikapı İDO Hızlı Feribot İskelesi',
    city: 'İstanbul',
    type: 'feribot',
    address: 'Kennedy Cad., Fatih / İstanbul',
    metroConnection: 'M1A, M1B, M2 Metroları ve Marmaray Yenikapı İstasyonu (5 dk yürüme)',
    transitLines: ['Marmaray Halkalı - Gebze', 'M2 Hacıosman - Yenikapı', 'M1A/M1B Havalimanı & Kirazlı'],
    amenities: ['Araçlı Biniş Gişeleri', 'Kafeterya', 'Açık Otopark', 'Bilet Satış & Danışma'],
    tips: 'Araçlı yolcuların kalkış saatinden 30 dakika önce biniş şeritlerinde hazır bulunması gerekmektedir.',
    gateInfo: 'İskele 1, 2, 3 ve Araç Rampa Hatları',
  },
];

interface TerminalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TerminalGuideModal: React.FC<TerminalGuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedType, setSelectedType] = useState<'all' | 'otobus' | 'ucak' | 'tren' | 'feribot'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalInfo>(TERMINALS_DATA[0]);

  if (!isOpen) return null;

  const filteredTerminals = TERMINALS_DATA.filter((t) => {
    if (selectedType !== 'all' && t.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q) || t.address.toLowerCase().includes(q);
    }
    return true;
  });

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'otobus':
        return <BileoBus className="w-4 h-4" />;
      case 'ucak':
        return <BileoPlane className="w-4 h-4" />;
      case 'tren':
        return <BileoTrain className="w-4 h-4" />;
      case 'feribot':
        return <BileoFerry className="w-4 h-4" />;
      default:
        return <BileoMapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-bordeaux-50 flex items-center justify-center text-bordeaux-700">
              <BileoMapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Terminal & Gar Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">Ulaşım, metro bağlantıları, peron bilgileri ve olanaklar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3.5 bg-white/60 border-b border-[#E8E1D5] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'all', label: 'Tüm Terminaller' },
              { id: 'otobus', label: 'Otogarlar' },
              { id: 'ucak', label: 'Havalimanları' },
              { id: 'tren', label: 'YHT Garları' },
              { id: 'feribot', label: 'İskeleler' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-bordeaux-700 text-white shadow-2xs'
                    : 'bg-white hover:bg-cream-100 text-charcoal-muted border border-[#E8E1D5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Terminal veya şehir ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-[#E8E1D5] bg-white text-xs font-bold text-[#1E1B18] focus:outline-none focus:border-bordeaux-700 w-full sm:w-56"
          />
        </div>

        {/* Two-Column Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          
          {/* Left List */}
          <div className="md:col-span-5 p-4 border-r border-[#E8E1D5] overflow-y-auto space-y-2 max-h-64 md:max-h-none">
            {filteredTerminals.map((terminal) => {
              const isSelected = selectedTerminal.id === terminal.id;
              return (
                <button
                  key={terminal.id}
                  onClick={() => setSelectedTerminal(terminal)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-white border-bordeaux-700 shadow-md ring-1 ring-bordeaux-700/20'
                      : 'bg-white/70 hover:bg-white border-[#E8E1D5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-bordeaux-50 text-bordeaux-700 uppercase">
                      {terminal.city}
                    </span>
                    <span className="text-charcoal-muted">{getTransportIcon(terminal.type)}</span>
                  </div>
                  <h4 className="text-xs font-black text-[#1E1B18] line-clamp-1">{terminal.name}</h4>
                  <p className="text-[11px] text-charcoal-muted line-clamp-1 mt-0.5">{terminal.metroConnection}</p>
                </button>
              );
            })}
          </div>

          {/* Right Detail Pane */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5 bg-white">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-bordeaux-700 uppercase tracking-wider mb-1">
                <span>{selectedTerminal.city}</span>
                <span>•</span>
                <span>{selectedTerminal.gateInfo}</span>
              </div>
              <h3 className="text-xl font-black text-[#1E1B18] font-display">{selectedTerminal.name}</h3>
              <p className="text-xs text-charcoal-muted mt-1 font-medium">{selectedTerminal.address}</p>
            </div>

            {/* Metro & Transit Connection Card */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-2">
              <span className="text-[10px] font-extrabold text-charcoal uppercase tracking-wider block">
                Raylı Sistem & Toplu Taşıma Bağlantısı
              </span>
              <p className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                <BileoCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{selectedTerminal.metroConnection}</span>
              </p>
              {selectedTerminal.transitLines && selectedTerminal.transitLines.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedTerminal.transitLines.map((line, lIdx) => (
                    <span key={lIdx} className="px-2 py-0.5 rounded-md bg-white border border-[#E8E1D5] text-[10px] font-extrabold text-charcoal shadow-2xs">
                      🚆 {line}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities Grid */}
            <div>
              <span className="text-[11px] font-extrabold text-charcoal uppercase tracking-wider block mb-2.5">
                Terminal Olanakları & Hizmetler
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedTerminal.amenities.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF7F2] text-xs font-bold text-charcoal border border-[#E8E1D5]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-bordeaux-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Travel Tips */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
              <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1">
                Önemli Yolcu İpuçları
              </span>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">
                {selectedTerminal.tips}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
