import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoCheck,
} from './icons';
import { sound } from '../utils/sound';

interface OvernightTravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info' | 'promo') => void;
}

interface SleeperGuideItem {
  id: string;
  category: 'tren' | 'otobus';
  title: string;
  badge: string;
  specs: string[];
  tips: string;
  popularRoutes: string[];
}

const OVERNIGHT_GUIDES: SleeperGuideItem[] = [
  {
    id: 'tcdd-yatakli',
    category: 'tren',
    title: 'TCDD Özel 2 Kişilik Yataklı Kompartıman',
    badge: '⭐ VIP Otel Konforu',
    specs: [
      'İçeriden kilitlenebilir özel oda (2 kişilik ranza yatak)',
      'Özel lavabo, ayna ve mini buzdolabı',
      'Mühürlü temiz nevresim, yastık ve yün battaniye paketi',
      '220V kesintisiz priz, klima ve ayarlanabilir ısıtma',
      'Yemekli vagon (Restoran) geçiş hakkı',
    ],
    tips: 'Oda içerisindeki lavaboyu rahatça kullanabilir, mini buzdolabına kendi atıştırmalıklarınızı koyabilirsiniz.',
    popularRoutes: [
      'Doğu Ekspresi (Ankara ↔ Kars)',
      'Ankara Ekspresi (İstanbul Halkalı ↔ Ankara)',
      'İzmir Mavi Treni (İzmir Basmane ↔ Ankara)',
      'Vangölü Ekspresi (Ankara ↔ Tatvan)',
    ],
  },
  {
    id: 'tcdd-kusətli',
    category: 'tren',
    title: 'TCDD 4 Kişilik Örtülü Kuşetli Vagon',
    badge: '👥 Aile & Arkadaş Grubu',
    specs: [
      'Karşılıklı koltukların yatağa dönüştüğü 4 kişilik bölme',
      'TCDD görevlileri tarafından dağıtılan mühürlü nevresim seti',
      'Ortak kompartıman kapısı ve geniş bagaj alanı',
      'Ekonomik yataklı seyahat alternatifi',
    ],
    tips: '4 arkadaş veya ailece seyahat ediyorsanız kompartımanın 4 koltuğunu da alarak tüm odayı kendinize tahsis edebilirsiniz.',
    popularRoutes: [
      'Güney Kurtalan Ekspresi (Ankara ↔ Kurtalan)',
      'Doğu Ekspresi (Ankara ↔ Kars)',
      'Göller Ekspresi (İzmir ↔ Isparta)',
    ],
  },
  {
    id: 'otobus-gece',
    category: 'otobus',
    title: '2+1 Süit Gece Otobüsü Seferleri',
    badge: '🌙 Hızlı & Kesintisiz',
    specs: [
      'Tekli ve çiftli geniş aralıklı yatabilen süit koltuklar',
      'Gece 00:00 - 06:00 arası loş kırmızı gece aydınlatması',
      'Sessiz kabin kuralı ve fısıltı seviyesinde ikram servisi',
      'Koltuk arkası 220V priz ve USB hızlı şarj',
      'Sabah 06:30 - 08:00 arası şehir merkezi varış avantajı',
    ],
    tips: 'Tekli koltuk (tek başına seyahat edenler için) seçildiğinde koridor veya cam kenarı bölünmezliği sağlanır.',
    popularRoutes: [
      'İstanbul ↔ Antalya Gece Seferi (22:00 kalkış, 07:30 varış)',
      'Ankara ↔ İzmir Gece Ekspresi (23:00 kalkış, 07:00 varış)',
      'İstanbul ↔ Bodrum Gece Seferi (21:30 kalkış, 08:00 varış)',
    ],
  },
];

const PACKING_ITEMS = [
  { id: '1', name: 'Göz Bandı (Uyku Maskesi) & Kulak Tıkacı', checked: true },
  { id: '2', name: 'Ergonomik Şişme Boyun Yastığı', checked: true },
  { id: '3', name: 'Taşınabilir Powerbank & Uzun Şarj Kablosu', checked: true },
  { id: '4', name: 'Oda İçi Rahat Terlik & Kalın Seyahat Çorabı', checked: false },
  { id: '5', name: 'Sıcak Su Termosu & Mini Atıştırmalık Çantası', checked: false },
  { id: '6', name: 'Kişisel Islak Mendil & Diş Fırçalama Kiti', checked: false },
];

export const OvernightTravelModal: React.FC<OvernightTravelModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [checklist, setChecklist] = useState(PACKING_ITEMS);
  const [activeTab, setActiveTab] = useState<'all' | 'tren' | 'otobus'>('all');

  if (!isOpen) return null;

  const toggleCheck = (id: string) => {
    sound.playTick();
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const filteredGuides = activeTab === 'all'
    ? OVERNIGHT_GUIDES
    : OVERNIGHT_GUIDES.filter((g) => g.category === activeTab);

  const handleSaveChecklist = () => {
    sound.playSuccess();
    if (onShowToast) {
      onShowToast(
        'Gece Yolculuğu Hazırlığı Tamamlandı!',
        'Konfor kontrol listeniz kaydedildi. Keyifli ve dinlendirici yolculuklar!',
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
            <div className="w-10 h-10 rounded-2xl bg-indigo-950 text-indigo-200 flex items-center justify-center border border-indigo-900 text-lg font-black">
              🌙
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Gece Seferleri & Yataklı Tren Deneyimi</h3>
              <p className="text-xs text-charcoal-muted font-medium">TCDD Yataklı/Kuşetli Vagon Rehberi, 2+1 Gece Otobüsü Konforu & Hazırlık Listesi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="px-6 py-3 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              sound.playTick();
              setActiveTab('all');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-indigo-900 text-white shadow-soft'
                : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
            }`}
          >
            Tüm Gece Seferleri
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playTick();
              setActiveTab('tren');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tren'
                ? 'bg-bordeaux-700 text-white shadow-soft'
                : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
            }`}
          >
            🚂 TCDD Yataklı & Kuşetli
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playTick();
              setActiveTab('otobus');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'otobus'
                ? 'bg-indigo-900 text-white shadow-soft'
                : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
            }`}
          >
            🚌 2+1 Gece Otobüsleri
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Guide Cards */}
          <div className="space-y-4">
            {filteredGuides.map((guide) => (
              <div
                key={guide.id}
                className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-2xs space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">
                      {guide.category === 'tren' ? 'TCDD TAŞIMACILIK VAGONU' : 'ŞEHİRLERARASI OTOBÜS'}
                    </span>
                    <h4 className="text-base font-black text-charcoal">{guide.title}</h4>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-black">
                    {guide.badge}
                  </span>
                </div>

                {/* Specs List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {guide.specs.map((spec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-charcoal font-medium">
                      <span className="text-emerald-600 font-black mt-0.5">✓</span>
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>

                {/* Tip */}
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 font-medium">
                  <span className="font-black text-amber-900">💡 Gece Yolculuğu İpucu: </span>
                  {guide.tips}
                </div>

                {/* Popular Routes */}
                <div className="pt-2 border-t border-[#E8E1D5]/60">
                  <span className="text-[10px] font-black text-charcoal-muted uppercase tracking-wider block mb-1.5">
                    Popüler Sefer Hatları:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.popularRoutes.map((r, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-cream-50 text-charcoal border border-[#E8E1D5] text-[11px] font-bold"
                      >
                        📍 {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Packing Checklist */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-black text-charcoal font-display">
                  🎒 Gece Seyahati Konfor Kontrol Listesi
                </h5>
                <p className="text-xs text-charcoal-muted font-medium">Yola çıkmadan önce çantanıza eklemeniz tavsiye edilen temel konfor eşyaları</p>
              </div>
              <span className="text-xs font-black text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                {checklist.filter((c) => c.checked).length} / {checklist.length} Hazır
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    item.checked
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-[#FAF7F2] border-[#E8E1D5] text-charcoal hover:bg-white'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors flex-shrink-0 ${
                      item.checked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-charcoal-muted/40 bg-white'
                    }`}
                  >
                    {item.checked && <BileoCheck className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs">{item.name}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveChecklist}
              className="w-full py-3 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-soft flex items-center justify-center gap-2"
            >
              <BileoShieldCheck className="w-4 h-4" />
              <span>Listeyi Kaydet & Hazırlığı Onayla</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
