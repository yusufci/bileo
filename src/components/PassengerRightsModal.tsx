import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoPlane,
  BileoBus,
  BileoTrain,
  BileoFerry,
} from './icons';
import { sound } from '../utils/sound';

interface PassengerRightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RightRule {
  id: string;
  mode: 'ucak' | 'otobus' | 'tren' | 'feribot';
  title: string;
  lawName: string;
  delayShort: string;
  delayLong: string;
  cancellation: string;
  refundPolicy: string;
  compensationAmount: string;
  authorities: string;
}

const RIGHTS_DATA: RightRule[] = [
  {
    id: 'ucak-haklari',
    mode: 'ucak',
    title: 'Havayolu Yolcu Hakları (SHY-PASS)',
    lawName: 'SHGM Yolcu Hakları Yönetmeliği (SHY-PASS & EC261)',
    delayShort: '2-3 saat arası rötarda ücretsiz sıcak/soğuk içecek ve 2 adet telefon görüşmesi/e-posta hakkı.',
    delayLong: '8+ saat gece rötarlarında 4-5 yıldızlı otelde ücretsiz konaklama ve havalimanı-otel gidiş-dönüş VIP transfer.',
    cancellation: 'Uçuş firmanın kusuruyla iptal edildiğinde kesintisiz tam bilet iadesi veya en erken alternatif uçuş.',
    refundPolicy: 'Kalkıştan 2 saat öncesine kadar esnek biletlerde cezasız iade veya tarih değişikliği.',
    compensationAmount: 'İç hatlarda 100€ karşılığı TL, dış hatlarda mesafeye göre 250€ - 600€ tazminat hakkı.',
    authorities: 'Sivil Havacılık Genel Müdürlüğü (SHGM) & Ciner / e-Devlet Yolcu Hakları Portalı',
  },
  {
    id: 'otobus-haklari',
    mode: 'otobus',
    title: 'Karayolu & Otobüs Yolcu Hakları',
    lawName: '4925 Sayılı Karayolu Taşıma Kanunu & Yönetmeliği',
    delayShort: 'Kalkış saati 1 saat geciktiğinde firma bilgilendirme ve terminal içi bekleme alanı sağlamak zorundadır.',
    delayLong: 'Araç arızasında 2 saat içinde yedek otobüs tahsis edilemezse bilet ücreti anında nakit iade edilir.',
    cancellation: 'Sefer iptalinde firmanın yolcuyu aynı gün başka bir firmayla gönderme veya tam iade yapma yükümlülüğü vardır.',
    refundPolicy: 'Kalkışa 24 saat kalana kadar koşulsuz %100 bilet iadesi; 12 saat kalana kadar 6 ay geçerli açık bilet.',
    compensationAmount: 'Hasarlı veya kayıp bagajda kg başına Karayolu Taşıma Yönetmeliği yasal tazminat tutarı.',
    authorities: 'Ulaştırma ve Altyapı Bakanlığı (U-ETDS) & Tüketici Hakem Heyetleri (TUBİS)',
  },
  {
    id: 'tren-haklari',
    mode: 'tren',
    title: 'TCDD YHT & Tren Yolcu Hakları',
    lawName: 'TCDD Taşımacılık Yolcu Taşıma Kuralları & AB Demiryolu Hakları',
    delayShort: '60 - 119 dakika arası YHT rötarında bilet ücretinin %50’si oranında iade veya seyahat kuponu.',
    delayLong: '120 dakika ve üzeri rötarlarda bilet ücretinin %100’ü oranında tam iade.',
    cancellation: 'Sefer iptalinde herhangi bir kesinti olmaksızın tam iade veya bir sonraki ilk trene ücretsiz kayıt.',
    refundPolicy: 'Kalkışa 60 dakika kalana kadar cezasız açık bilete çevirme veya kesintisiz iade hakkı.',
    compensationAmount: 'Rötar iadesi nakit veya 1 yıl geçerli TCDD seyahat kuponu olarak ödenir.',
    authorities: 'TCDD Taşımacılık Müşteri Hizmetleri & T.C. Ulaştırma Bakanlığı',
  },
  {
    id: 'feribot-haklari',
    mode: 'feribot',
    title: 'Denizyolu & Feribot Yolcu Hakları',
    lawName: 'Deniz Yolu ile Seyahat Eden Yolcuların Haklarına Dair Yönetmelik',
    delayShort: '90 dakikayı aşan kalkış gecikmelerinde ücretsiz içecek ve atıştırmalık ikramı.',
    delayLong: 'Hava muhalefeti (fırtına/lodos) dışındaki teknik arızalarda konaklama veya transfer desteği.',
    cancellation: 'Olumsuz hava koşulları nedeniyle iptal edilen tüm seferlerde kesintisiz %100 bilet iadesi.',
    refundPolicy: 'Kalkış saatinden önce iptal edilen biletlerin ücreti 7 iş günü içinde karta iade edilir.',
    compensationAmount: 'Seyir süresi gecikmelerinde %25 - %50 oranında bilet ücreti iadesi.',
    authorities: 'Denizcilik Genel Müdürlüğü & Liman Başkanlıkları',
  },
];

export const PassengerRightsModal: React.FC<PassengerRightsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<string>('ucak-haklari');
  const [calculatorMode, setCalculatorMode] = useState<'ucak' | 'otobus' | 'tren'>('ucak');
  const [delayHours, setDelayHours] = useState<number>(3);

  if (!isOpen) return null;

  const current = RIGHTS_DATA.find((r) => r.id === selectedId) || RIGHTS_DATA[0];

  const handleSelect = (id: string) => {
    sound.playTick();
    setSelectedId(id);
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'ucak': return BileoPlane;
      case 'otobus': return BileoBus;
      case 'tren': return BileoTrain;
      case 'feribot': return BileoFerry;
      default: return BileoPlane;
    }
  };

  const calculateRightsResult = () => {
    if (calculatorMode === 'ucak') {
      if (delayHours >= 8) return 'Ücretsiz 4-5 Yıldızlı Otel Konaklaması + VIP Havalimanı Transferi + Sıcak Yemek + 100€/250€ Tazminat';
      if (delayHours >= 5) return 'Sıcak Yemek İkramı + İsterseniz Biletin Tam Ücret İadesi veya Alternatif Uçuş';
      if (delayHours >= 2) return 'Ücretsiz Sıcak/Soğuk İçecek, Sandviç ve 2 Adet İletişim (Telefon/E-posta) Hakkı';
      return 'Standart terminal beklemesi, henüz yasal ikram zorunluluğu başlamamıştır.';
    }
    if (calculatorMode === 'otobus') {
      if (delayHours >= 2) return 'Firma Tarafından Anında Yedek Araç Tahsisi VEYA Bilet Ücretinin %100 Nakit İadesi';
      if (delayHours >= 1) return 'Terminal İçi Bekleme Alanı & Sefer Durumu Yazılı/Sözlü Bilgilendirmesi';
      return '1 saatin altındaki gecikmelerde sefer hazırlıkları takip edilir.';
    }
    if (calculatorMode === 'tren') {
      if (delayHours >= 2) return '%100 Tam Bilet Ücreti İadesi veya 1 Yıl Geçerli TCDD Seyahat Kuponu';
      if (delayHours >= 1) return '%50 Bilet Ücreti İadesi veya İndirim Kuponu';
      return '1 saatin altındaki YHT gecikmelerinde ray hattı önceliği takip edilir.';
    }
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <BileoShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Yolcu Hakları, İptal & Rötar Tazminat Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">SHY-PASS, Karayolu Taşıma Kanunu ve TCDD Yasal Tüketici Güvenceleri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 py-3 bg-white/50 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {RIGHTS_DATA.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelect(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedId === r.id
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              {React.createElement(getModeIcon(r.mode), { className: 'w-3.5 h-3.5' })}
              <span>{r.title.split('(')[0].trim()}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Title & Law Reference */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 shadow-2xs">
            <span className="text-[10px] font-black text-bordeaux-700 uppercase tracking-widest block">
              📜 YASAL DAYANAK
            </span>
            <h4 className="text-base font-black text-charcoal font-display">{current.title}</h4>
            <p className="text-xs text-charcoal-muted font-medium">{current.lawName}</p>
          </div>

          {/* 4 Rights Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1.5 shadow-2xs">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                ☕ Kısa Süreli Rötar & İkram Hakları
              </span>
              <p className="text-xs font-bold text-charcoal leading-relaxed">{current.delayShort}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1.5 shadow-2xs">
              <span className="text-[10px] font-black text-purple-800 uppercase tracking-wider block">
                🏨 Uzun Rötar & Otel Konaklaması
              </span>
              <p className="text-xs font-bold text-charcoal leading-relaxed">{current.delayLong}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1.5 shadow-2xs">
              <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">
                ❌ Sefer İptali & Kesintisiz İade
              </span>
              <p className="text-xs font-bold text-charcoal leading-relaxed">{current.cancellation}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1.5 shadow-2xs">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                💶 Yasal Tazminat Hakları
              </span>
              <p className="text-xs font-bold text-charcoal leading-relaxed">{current.compensationAmount}</p>
            </div>

          </div>

          {/* Interactive Delay Rights Calculator */}
          <div className="p-5 rounded-3xl bg-cream-100/80 border border-[#E8E1D5] space-y-3.5">
            <span className="text-[11px] font-black text-bordeaux-700 uppercase tracking-wider block">
              🧮 İnteraktif Rötar Hakları Hesaplayıcı
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-1">
                  Ulaşım Türü
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['ucak', 'otobus', 'tren'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCalculatorMode(m)}
                      className={`py-2 rounded-xl text-xs font-black transition-colors cursor-pointer capitalize ${
                        calculatorMode === m
                          ? 'bg-bordeaux-700 text-white'
                          : 'bg-white text-charcoal border border-[#E8E1D5]'
                      }`}
                    >
                      {m === 'ucak' ? '✈️ Uçak' : m === 'otobus' ? '🚌 Otobüs' : '🚆 YHT'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-1">
                  Rötar Süresi ({delayHours} Saat)
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={delayHours}
                  onChange={(e) => setDelayHours(Number(e.target.value))}
                  className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-bordeaux-700 mt-2"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-start gap-2.5">
              <BileoShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-0.5">
                  Yasal Olarak Hak Ettiğiniz Hizmetler:
                </span>
                <p className="text-xs font-black text-emerald-950 leading-relaxed">
                  {calculateRightsResult()}
                </p>
              </div>
            </div>
          </div>

          {/* Official Complaint Channels */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1">
            <span className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-0.5">
              🏛️ Resmi Başvuru & Şikayet Mercileri
            </span>
            <p className="text-xs text-charcoal-muted font-medium leading-relaxed">
              Haklarınızın firma tarafından karşılanmaması durumunda <strong>{current.authorities}</strong> veya <strong>e-Devlet Tüketici Hakem Heyetleri</strong> üzerinden 15 gün içinde resmi başvuru oluşturabilirsiniz.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
