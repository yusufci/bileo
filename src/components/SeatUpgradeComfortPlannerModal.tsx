import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoCheckCircle,
  BileoBus,
} from './icons';
import { sound } from '../utils/sound';

interface SeatUpgradeComfortPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface UpgradeOption {
  id: string;
  name: string;
  tag: string;
  mode: 'bus' | 'train' | 'both';
  costType: 'discount_half' | 'fixed_diff' | 'free_rule';
  multiplier: number;
  fixedExtra: number;
  description: string;
  benefits: string[];
  recommendedFor: string;
}

const UPGRADE_OPTIONS: UpgradeOption[] = [
  {
    id: 'empty_next_seat',
    name: 'Yan Koltuğu Kapatma (Yanım Boş Kalsın)',
    tag: '%50 İndirimli Yan Koltuk',
    mode: 'bus',
    costType: 'discount_half',
    multiplier: 0.5,
    fixedExtra: 0,
    description: '2+1 veya 2+2 otobüslerde çiftli koltukta seyahat ederken yan koltuğunuzu %50 indirimle satın alarak tamamen boş bırakabilirsiniz.',
    benefits: [
      'Yanınızda yabancı yolcu olmadan tam mahremiyet',
      'Kişisel çanta ve mont için ekstra geniş alan',
      'Yolculuk boyunca kol dayama ve ferah oturum özgürlüğü',
      'Resmi biletli tahsis ile kaptan veya muavinin müdahale edememesi',
    ],
    recommendedFor: 'Gece seferleri, laptop ile çalışanlar ve uzun yolculuklar',
  },
  {
    id: 'front_row_panoramic',
    name: 'Ön Sıra Panoramik Koltuk Tercihi',
    tag: 'Ekstra Diz Mesafesi',
    mode: 'bus',
    costType: 'fixed_diff',
    multiplier: 0,
    fixedExtra: 50,
    description: 'Otobüsün 1, 2, 3 ve 4 numaralı en ön sıra koltuklarında kesintisiz yol manzarası ve ferah bacak alanı.',
    benefits: [
      'Geniş ön cam panoramik seyir deneyimi',
      'Ön koltuğun arkaya yatması derdi olmadan sabit alan',
      'Molalarda ve varışta ilk inme önceliği',
      'Hızlı ve kolay bagaj erişimi',
    ],
    recommendedFor: 'Yol manzarası izlemeyi seven gezginler ve uzun boylu yolcular',
  },
  {
    id: 'yht_business_class',
    name: 'YHT Business Vagon Yükseltmesi',
    tag: 'Deri Koltuk & 220V Priz',
    mode: 'train',
    costType: 'fixed_diff',
    multiplier: 0,
    fixedExtra: 160,
    description: 'TCDD Yüksek Hızlı Tren seferlerinde standart ekonomi biletinizi tek tıkla 2+1 geniş deri koltuklu Business sınıfa yükseltin.',
    benefits: [
      'Geniş 2+1 deri koltuk dizilimi ve ayarlanabilir ayak koyma aparatı',
      'Her koltukta bağımsız 220V priz ve USB şarj yuvası',
      'Daha sessiz ve kurumsal yolcu profiline ayrılmış vagon',
      'Geniş çalışma masası ve ikram önceliği',
    ],
    recommendedFor: 'İş seyahatleri ve konforlu tren yolculuğu arayanlar',
  },
  {
    id: 'smart_shade_seat',
    name: 'Akıllı Güneş & Gölge Tarafı Seçimi',
    tag: 'Ücretsiz Algoritmik Seçim',
    mode: 'both',
    costType: 'free_rule',
    multiplier: 0,
    fixedExtra: 0,
    description: 'Güneşin doğuş/batış açısına ve sefer saatinize göre yol boyunca gölgede kalan serin koltuğu otomatik belirler.',
    benefits: [
      'Gözünüzü almayan ve klima etkisini azaltmayan gölge taraf',
      'Öğleden sonra batıya giden seferlerde sağ taraf avantajı',
      'Sabah saatlerinde doğuya giden seferlerde sol taraf avantajı',
      'Sıfır ek ücret ile en ideal koltuk numarası eşleşmesi',
    ],
    recommendedFor: 'Gündüz seferleri ve güneşten rahatsız olan hassas yolcular',
  },
];

export const SeatUpgradeComfortPlannerModal: React.FC<SeatUpgradeComfortPlannerModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<string>('empty_next_seat');
  const [baseTicketPrice, setBaseTicketPrice] = useState<number>(650);

  if (!isOpen) return null;

  const currentOption = UPGRADE_OPTIONS.find((u) => u.id === selectedUpgradeId) || UPGRADE_OPTIONS[0];

  let calculatedExtraCost = 0;
  if (currentOption.costType === 'discount_half') {
    calculatedExtraCost = Math.round(baseTicketPrice * currentOption.multiplier);
  } else if (currentOption.costType === 'fixed_diff') {
    calculatedExtraCost = currentOption.fixedExtra;
  }

  const totalCost = baseTicketPrice + calculatedExtraCost;

  const handleApply = () => {
    sound.playSuccess();
    if (onShowToast) {
      onShowToast(
        'Konfor Tercihi Kaydedildi',
        `${currentOption.name} seçeneği biletleme profilinize tanımlandı.`,
        'success'
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-bordeaux-50 text-bordeaux-900 flex items-center justify-center border border-bordeaux-200">
              <BileoBus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Koltuk Yükseltme & Ekstra Konfor Asistanı</h3>
              <p className="text-xs text-charcoal-muted font-medium">Yan koltuğu kapatma, ön sıra panoramik koltuk ve YHT Business yükseltme rehberi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Upgrade Mode Cards */}
          <div className="space-y-2">
            <label className="text-xs font-black text-charcoal uppercase tracking-wider block">
              Konfor Seçeneğini Belirleyin
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {UPGRADE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { sound.playTick(); setSelectedUpgradeId(opt.id); }}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer shadow-2xs ${
                    selectedUpgradeId === opt.id
                      ? 'bg-bordeaux-900 text-white border-bordeaux-900 shadow-soft'
                      : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 uppercase tracking-wider">
                      {opt.mode === 'bus' ? 'Otobüs' : opt.mode === 'train' ? 'YHT' : 'Tüm Modlar'}
                    </span>
                  </div>
                  <div className="font-black text-xs leading-snug">{opt.name}</div>
                  <div className={`text-[10px] font-medium pt-1 ${selectedUpgradeId === opt.id ? 'text-rose-200' : 'text-emerald-700'}`}>
                    {opt.tag}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Calculator & Specs Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Benefits Column */}
            <div className="md:col-span-2 p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-4">
              <div className="border-b border-[#E8E1D5] pb-3">
                <h4 className="text-base font-black text-charcoal font-display">{currentOption.name}</h4>
                <p className="text-xs text-charcoal-muted leading-relaxed font-medium pt-1">
                  {currentOption.description}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black text-charcoal uppercase tracking-wider block">
                  Ayrıcalıklar & Yolcu Hakları:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentOption.benefits.map((b, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] flex items-start gap-2 text-xs font-medium text-charcoal">
                      <BileoCheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs font-medium text-amber-950">
                <span className="font-black text-amber-900 block">Kullanım Tavsiyesi:</span>
                {currentOption.recommendedFor}
              </div>
            </div>

            {/* Price Simulation Column */}
            <div className="p-5 rounded-3xl bg-bordeaux-900 text-white shadow-md flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold text-rose-200 uppercase tracking-wider block">
                  Konfor Maliyet Simülasyonu
                </span>
                
                <div className="mt-3 space-y-2 text-xs">
                  <label className="text-[11px] font-bold text-rose-100 block">Bilet Ücreti (TL):</label>
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={baseTicketPrice}
                    onChange={(e) => setBaseTicketPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 font-mono font-bold text-white focus:bg-white/20 outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-white/20 mt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between text-rose-200">
                    <span>Standart Koltuk:</span>
                    <span className="font-mono">{baseTicketPrice.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div className="flex justify-between text-rose-200">
                    <span>Konfor Eklentisi:</span>
                    <span className="font-mono font-bold text-emerald-300">
                      {calculatedExtraCost === 0 ? 'ÜCRETSİZ' : `+${calculatedExtraCost.toLocaleString('tr-TR')} ₺`}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-black pt-2 border-t border-white/20 text-white">
                    <span>Toplam:</span>
                    <span className="font-mono text-emerald-400">{totalCost.toLocaleString('tr-TR')} ₺</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApply}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-cream-100 text-bordeaux-950 font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <BileoCheckCircle className="w-3.5 h-3.5" />
                <span>Bu Konfor Modunu Uygula</span>
              </button>
            </div>

          </div>

          {/* Footer Guarantee */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-charcoal-muted font-medium">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Satın alınan ekstra yan koltuk PNR dökümünde resmi ikinci koltuk olarak tescillenir.</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal font-black text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
