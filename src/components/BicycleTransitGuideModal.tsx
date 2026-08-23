import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoCheckCircle,
} from './icons';
import { sound } from '../utils/sound';

interface BicycleTransitGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface TransitPolicy {
  id: string;
  modeName: string;
  icon: string;
  badge: string;
  foldingBikes: string;
  standardBikes: string;
  electricScooters: string;
  feeInfo: string;
  rules: string[];
}

const TRANSIT_POLICIES: TransitPolicy[] = [
  {
    id: 'otobus',
    modeName: 'Şehirlerarası Otobüs',
    icon: '🚌',
    badge: 'Bagaj Hacmine Bağlı',
    foldingBikes: 'Özel kılıfında veya çantasında bagaj hacmini aşmadığı sürece tamamen ücretsiz.',
    standardBikes: 'Ön tekeri sökülmüş, pedalları içe çevrilmiş ve koruma kılıfına sarılmış olmalıdır.',
    electricScooters: 'Katlanmış vaziyette, lityum bataryası kapalı olarak bagajda taşınır.',
    feeInfo: 'Genellikle ücretsizdir (Aşırı yoğun bayram seferlerinde muavin ek bagaj ücreti talep edebilir).',
    rules: [
      'Kalkıştan önce muavine veya yazıhaneye bisiklet bildirimi yapılması önerilir.',
      'Zincir ve vites aksamının diğer yolcu bavullarını kirletmemesi için streçlenmesi zorunludur.',
      'Bagaj yükleme sırasında bisikletin en üste yatırılması rica edilmelidir.',
    ],
  },
  {
    id: 'tren',
    modeName: 'TCDD YHT & Anahat Trenleri',
    icon: '🚆',
    badge: 'TCDD Resmi Yönetmeliği',
    foldingBikes: 'Katlanabilir bisikletler el bagajı ebatlarını (65x50x35 cm) aşmıyorsa ücretsiz ve koltuk üstü/girişte taşınır.',
    standardBikes: 'Sadece furgonlu (bagaj vagonlu) bölgesel ve anahat ekspres trenlerde bisiklet biletiyle kabul edilir.',
    electricScooters: 'Katlanmış olarak el bagajı gibi vagon içine alınabilir.',
    feeInfo: 'Katlanır bisikletler Ücretsiz; standart bisikletler anahat trenlerinde küçük bir tarifeye tabidir.',
    rules: [
      'YHT (Yüksek Hızlı Tren) setlerinde standart (katlanmayan) bisiklet taşınamaz.',
      'Marmaray, Başkentray ve İZBAN banliyölerinde yoğun saatler (07:00-09:00 / 17:00-20:00) dışında son vagonda serbesttir.',
    ],
  },
  {
    id: 'ucak',
    modeName: 'Uçak (THY, Pegasus, SunExpress)',
    icon: '✈️',
    badge: 'Spor Ekipmanı Statüsü',
    foldingBikes: 'Kabin boy katlanır bisikletler boyut limitine uyarsa veya kargo bagajında teslim edilir.',
    standardBikes: 'Bisiklet kutusu (Hardcase veya sert karton bisiklet kolisi) içinde teslim edilmelidir.',
    electricScooters: 'Bataryası 100Wh üzerindeki lityum e-scooterlar IATA kuralları gereği yolcu uçağına kabul edilmez.',
    feeInfo: 'Yurt içi uçuşlarda sabit spor ekipmanı ücreti (450 - 750 ₺ arası).',
    rules: [
      'Lastik havası kabin basıncı nedeniyle tamamen indirilmelidir.',
      'Gidon kadroya paralel çevrilmeli, pedallar sökülmeli ve vites kilitlenmelidir.',
      'Uçuştan en az 24 saat önce çağrı merkezinden spor ekipmanı kaydı açılmalıdır.',
    ],
  },
  {
    id: 'feribot',
    modeName: 'Feribot & Deniz Otobüsü (İDO, BUDO, GESTAŞ)',
    icon: '⛴️',
    badge: 'En Bisiklet Dostu Ulaşım',
    foldingBikes: 'Tüm deniz otobüsü ve hızlı katamaran yolcu salonlarına katlanmış halde ücretsiz alınır.',
    standardBikes: 'Arabalı vapurların araç güvertesinde veya deniz otobüsü açık kıç alanında taşınır.',
    electricScooters: 'Tüm seferlerde serbestçe taşınabilir.',
    feeInfo: 'Yolcu bileti haricinde ücretsiz veya sembolik 20 - 35 ₺ geçiş ücreti.',
    rules: [
      'Güvertede dalga veya rüzgardan devrilmemesi için feribot personeline gösterilen alana kilitlenmelidir.',
      'Geyikli-Bozcaada ve Kabatepe-Gökçeada ada hatlarında bisikletli geçiş önceliklidir.',
    ],
  },
];

const POPULAR_BIKE_ROUTES = [
  {
    name: 'EuroVelo 8: İzmir & Efes - Bergama Rotası',
    km: '500 km',
    difficulty: 'Orta',
    transitTips: 'İzmir İZBAN banliyö treni ve Foça/Dikili otobüs bagajı ile etap etap geçilebilir.',
  },
  {
    name: 'Kapadokya Vadileri Gravel & Dağ Bisikleti',
    km: '180 km',
    difficulty: 'Zor / Manzaralı',
    transitTips: 'Nevşehir ve Kayseri otobüsleriyle Göreme veya Ürgüp merkezine doğrudan ulaşım.',
  },
  {
    name: 'Frig Yolu & Eskişehir - Afyon Vadisi',
    km: '506 km',
    difficulty: 'Orta / Tarihi',
    transitTips: 'Eskişehir YHT garına katlanır bisikletle gelip Frig Vadisi rotasına başlanabilir.',
  },
  {
    name: 'Marmara Adası & Erdek Sahil Turu',
    km: '120 km',
    difficulty: 'Kolay / Keyifli',
    transitTips: 'Tekirdağ veya Erdek GESTAŞ/kooperatif arabalı motorlarıyla adalara bisikletli geçiş.',
  },
];

export const BicycleTransitGuideModal: React.FC<BicycleTransitGuideModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedModeId, setSelectedModeId] = useState<string>('otobus');
  const [activeTab, setActiveTab] = useState<'modes' | 'routes' | 'checklist'>('modes');

  if (!isOpen) return null;

  const currentPolicy = TRANSIT_POLICIES.find((p) => p.id === selectedModeId) || TRANSIT_POLICIES[0];

  const handleCopyPolicy = () => {
    sound.playSuccess();
    if (onShowToast) {
      onShowToast(
        'Kurallar İncelendi',
        `${currentPolicy.modeName} bisiklet taşıma yönergeleri kontrol listenize eklendi.`,
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-900 flex items-center justify-center border border-emerald-200 text-lg font-black">
              🚲
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Bisiklet & Scooter Ulaşım Rehberi</h3>
              <p className="text-xs text-charcoal-muted font-medium">Otobüs, tren, uçak ve feribotlarda bisiklet taşıma kuralları, paketleme ve EuroVelo rotaları</p>
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
          
          {/* Sub Navigation */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('modes'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'modes'
                  ? 'bg-emerald-900 text-white border-emerald-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              🚲 Ulaşım Modları Kuralları
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('routes'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'routes'
                  ? 'bg-emerald-900 text-white border-emerald-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              🗺️ Popüler Bisiklet Rotaları
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('checklist'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'checklist'
                  ? 'bg-emerald-900 text-white border-emerald-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              🧰 Paketleme & Hazırlık
            </button>
          </div>

          {activeTab === 'modes' && (
            <div className="space-y-4">
              
              {/* Mode Selection Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TRANSIT_POLICIES.map((policy) => (
                  <button
                    key={policy.id}
                    type="button"
                    onClick={() => { sound.playTick(); setSelectedModeId(policy.id); }}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer shadow-2xs flex items-center gap-2.5 ${
                      selectedModeId === policy.id
                        ? 'bg-emerald-900 text-white border-emerald-900 shadow-soft'
                        : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span className="text-lg">{policy.icon}</span>
                    <span className="text-xs font-black truncate">{policy.modeName.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Policy Details Card */}
              <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E1D5]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{currentPolicy.icon}</span>
                    <div>
                      <h4 className="text-sm font-black text-charcoal">{currentPolicy.modeName} Taşıma Politikası</h4>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {currentPolicy.badge}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-emerald-900 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200">
                    {currentPolicy.feeInfo}
                  </span>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
                    <strong className="text-charcoal font-black block">🚲 Katlanır Bisiklet</strong>
                    <p className="text-[11px] text-charcoal-muted leading-relaxed font-medium">
                      {currentPolicy.foldingBikes}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
                    <strong className="text-charcoal font-black block">🚵 Standart / Şehir Bisikleti</strong>
                    <p className="text-[11px] text-charcoal-muted leading-relaxed font-medium">
                      {currentPolicy.standardBikes}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1">
                    <strong className="text-charcoal font-black block">🛴 Elektrikli Scooter</strong>
                    <p className="text-[11px] text-charcoal-muted leading-relaxed font-medium">
                      {currentPolicy.electricScooters}
                    </p>
                  </div>
                </div>

                {/* Strict Rules */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <strong className="text-xs font-black text-amber-950 block">⚠️ Önemli Biniş & Taşıma Kuralları:</strong>
                  <ul className="space-y-1 text-xs text-amber-900 font-medium">
                    {currentPolicy.rules.map((rule, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-1.5">
                        <span className="text-amber-700 font-bold">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleCopyPolicy}
                    className="px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-soft"
                  >
                    <BileoCheckCircle className="w-3.5 h-3.5" />
                    <span>Kuralları Onayla</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'routes' && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-charcoal uppercase tracking-wider">Türkiye'nin Önemli Bisiklet Rotaları & Ulaşım İpuçları</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POPULAR_BIKE_ROUTES.map((route, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs hover:border-emerald-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-black text-charcoal text-xs">{route.name}</h5>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                        {route.km}
                      </span>
                    </div>

                    <div className="text-[11px] text-charcoal-muted space-y-1">
                      <div>
                        <span>Zorluk Seviyesi: </span>
                        <strong className="text-charcoal">{route.difficulty}</strong>
                      </div>
                      <p className="text-[11px] text-charcoal leading-relaxed font-medium bg-[#FAF7F2] p-2 rounded-xl border border-[#E8E1D5]">
                        💡 <strong>Ulaşım Taktikleri:</strong> {route.transitTips}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-4 text-xs">
              <h4 className="font-black text-charcoal text-sm">Bisikletle Şehirlerarası Seyahat Öncesi Kontrol Listesi</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1.5">
                  <strong className="text-charcoal font-black block">🔧 Gerekli Alet & Ekipmanlar:</strong>
                  <ul className="space-y-1 text-charcoal-muted font-medium">
                    <li>• 15mm pedal anahtarı (Pedalları sökmek için)</li>
                    <li>• 4/5/6 mm alyan çakısı (Gidon ve sele ayarı)</li>
                    <li>• Mini el pompası & yedek iç lastik</li>
                    <li>• Fermuarlı hafif bisiklet taşıma kılıfı</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-1.5">
                  <strong className="text-charcoal font-black block">🛡️ Koruma & Paketleme:</strong>
                  <ul className="space-y-1 text-charcoal-muted font-medium">
                    <li>• Arka aktarıcıyı (vites) korumak için köpük boru sarın</li>
                    <li>• Ön maşa arasına plastik koruma takozu yerleştirin</li>
                    <li>• Zinciri en küçük dişliye alıp streçleyin</li>
                    <li>• Uçak yolculuklarında lastik havasını %100 boşaltın</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-charcoal-muted font-medium">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Tüm yönergeler TCDD, DHMİ ve Karayolu Taşıma Yönetmeliği standartlarına uygundur.</span>
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
