import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoCheck,
  BileoPlane,
  BileoBus,
  BileoTrain,
  BileoFerry,
} from './icons';
import { sound } from '../utils/sound';

interface FrequentTravelerRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info' | 'promo') => void;
}

interface LoyaltyTier {
  id: string;
  name: string;
  badge: string;
  milesRange: string;
  earnMultiplier: string;
  colorClass: string;
  benefits: string[];
}

const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: 'klasik',
    name: 'Klasik Gezgin',
    badge: '🥉 Bronz',
    milesRange: '0 - 2.500 Mil',
    earnMultiplier: '%3 Mil İadesi',
    colorClass: 'border-amber-700/30 bg-amber-50/50 text-amber-950',
    benefits: [
      'Her bilet alışverişinde tutarın %3’ü kadar Bileo Mili kazanımı',
      'Bileo Cüzdan bakiyesiyle biriken milleri anında harcama',
      'Erken kampanya ve bayram dönemi bilet duyuruları',
    ],
  },
  {
    id: 'gumus',
    name: 'Gümüş Kaşif',
    badge: '🥈 Gümüş',
    milesRange: '2.500 - 10.000 Mil',
    earnMultiplier: '%6 Mil İadesi',
    colorClass: 'border-slate-300 bg-slate-50 text-slate-900',
    benefits: [
      'Her bilet alışverişinde %6 oranında çift kat mil',
      'Yılda 2 defa cezasız ücretsiz tarih/saat değişikliği hakkı',
      'Öncelikli 7/24 WhatsApp & Çağrı Merkezi VIP destek hattı',
      'Otobüs ve YHT seferlerinde ön sıralardan ücretsiz koltuk seçimi',
    ],
  },
  {
    id: 'altin',
    name: 'Altın Seyyah',
    badge: '🥇 Altın',
    milesRange: '10.000 - 25.000 Mil',
    earnMultiplier: '%10 Mil İadesi',
    colorClass: 'border-amber-400 bg-amber-50 text-amber-900',
    benefits: [
      'Her bilet alışverişinde %10 süper mil kazanımı',
      'Havalimanı ve Otogar VIP Lounge dinlenme salonu %50 indirimli giriş',
      'Tüm uçuş ve otobüs seferlerinde +5 kg ücretsiz ekstra bagaj hakkı',
      'Gecikme ve rötarlarda otomatik öncelikli bilet iade işlemi',
    ],
  },
  {
    id: 'platin',
    name: 'Platin Elit',
    badge: '💎 Platin',
    milesRange: '25.000+ Mil',
    earnMultiplier: '%15 Mil İadesi',
    colorClass: 'border-indigo-400 bg-indigo-50/70 text-indigo-950',
    benefits: [
      'Maksimum %15 mil kazanım oranı & ücretsiz hediye biletler',
      'Kalkış saatine 2 saat kalana dek koşulsuz kesintisiz iptal garantisi',
      'Tüm ulaşım modlarında sınırsız ücretsiz premium/business koltuk seçimi',
      'Kişisel seyahat asistanı ve ücretsiz havalimanı HAVAŞ servisi kuponları',
    ],
  },
];

export const FrequentTravelerRewardsModal: React.FC<FrequentTravelerRewardsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedTierId, setSelectedTierId] = useState<string>('altin');
  const [calcMode, setCalcMode] = useState<'otobus' | 'tren' | 'ucak' | 'feribot'>('tren');
  const [calcKm, setCalcKm] = useState<number>(450); // İstanbul - Ankara ~450km

  if (!isOpen) return null;

  const currentTier = LOYALTY_TIERS.find((t) => t.id === selectedTierId) || LOYALTY_TIERS[2];

  const handleSelectTier = (id: string) => {
    sound.playTick();
    setSelectedTierId(id);
  };

  const calculateEarnedMiles = () => {
    let multiplier = 1;
    if (calcMode === 'otobus') multiplier = 1;
    if (calcMode === 'tren') multiplier = 1.5;
    if (calcMode === 'ucak') multiplier = 2;
    if (calcMode === 'feribot') return 250; // sabit sefer başı
    return Math.round(calcKm * multiplier);
  };

  const handleJoinClub = () => {
    sound.playSuccess();
    if (onShowToast) {
      onShowToast('Bileo Mil Kulübü Aktif!', 'Tebrikler, hoş geldin hediyesi 500 Bileo Mili hesabınıza tanımlandı.', 'success');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center border border-amber-300 text-lg font-black">
              ⭐
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Bileo Milleri & Sık Seyahat Kulübü</h3>
              <p className="text-xs text-charcoal-muted font-medium">Her Seferde Mil Biriktirin, Ücretsiz Bilet ve VIP Ayrıcalıklar Kazanın</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Tier Selector Bar */}
        <div className="px-6 py-3 bg-white/60 border-b border-[#E8E1D5] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {LOYALTY_TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSelectTier(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedTierId === t.id
                  ? 'bg-bordeaux-700 text-white shadow-soft'
                  : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              <span>{t.badge}</span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Selected Tier Banner */}
          <div className={`p-5 rounded-3xl border ${currentTier.colorClass} shadow-2xs space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest block opacity-75">KULÜP KADEMESİ</span>
                <h4 className="text-xl font-black font-display flex items-center gap-2">
                  <span>{currentTier.badge}</span>
                  <span>{currentTier.name}</span>
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-white/80 border border-black/10 text-xs font-extrabold">
                  🎯 {currentTier.milesRange}
                </span>
                <span className="px-3 py-1 rounded-xl bg-bordeaux-700 text-white text-xs font-extrabold">
                  ⚡ {currentTier.earnMultiplier}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-black uppercase tracking-wider block opacity-90">
                Ayrıcalıklar & Avantajlar
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentTier.benefits.map((b, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 rounded-xl bg-white/90 border border-black/5 text-xs font-bold text-charcoal shadow-2xs"
                  >
                    <BileoCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Miles Calculator */}
          <div className="p-5 rounded-3xl bg-cream-100/80 border border-[#E8E1D5] space-y-3.5">
            <span className="text-[11px] font-black text-bordeaux-700 uppercase tracking-wider block">
              🧮 İnteraktif Mil Hesaplayıcı (Sefer Başına Kazanım)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-1">
                  Ulaşım Türü
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['otobus', 'tren', 'ucak', 'feribot'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCalcMode(m)}
                      className={`py-2 rounded-xl text-xs font-black transition-colors cursor-pointer capitalize flex items-center justify-center gap-1 ${
                        calcMode === m
                          ? 'bg-bordeaux-700 text-white'
                          : 'bg-white text-charcoal border border-[#E8E1D5]'
                      }`}
                    >
                      {m === 'otobus' ? <BileoBus className="w-3.5 h-3.5" /> : m === 'tren' ? <BileoTrain className="w-3.5 h-3.5" /> : m === 'ucak' ? <BileoPlane className="w-3.5 h-3.5" /> : <BileoFerry className="w-3.5 h-3.5" />}
                      <span className="text-[11px]">{m === 'otobus' ? 'Otobüs' : m === 'tren' ? 'YHT' : m === 'ucak' ? 'Uçak' : 'Deniz'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-charcoal uppercase tracking-wider block mb-1">
                  Mesafe ({calcMode === 'feribot' ? 'Standart Sefer' : `${calcKm} km`})
                </label>
                <input
                  type="range"
                  min="100"
                  max="1200"
                  step="50"
                  disabled={calcMode === 'feribot'}
                  value={calcKm}
                  onChange={(e) => setCalcKm(Number(e.target.value))}
                  className="w-full h-2 bg-cream-200 rounded-lg appearance-none cursor-pointer accent-bordeaux-700 mt-2 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BileoShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span className="text-xs font-bold text-charcoal">
                  Bu Seferden Kazanacağınız Tahmini Mil:
                </span>
              </div>
              <span className="text-sm font-black text-bordeaux-700 bg-cream-100 px-3 py-1 rounded-xl border border-[#E8E1D5]">
                +{calculateEarnedMiles()} Bileo Mili (≈ {Math.round(calculateEarnedMiles() * 0.15)} ₺ Değerinde)
              </span>
            </div>
          </div>

          {/* Join Club Action Box */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div>
              <h5 className="text-sm font-black text-charcoal">Bileo Sadakat Kulübü’ne Ücretsiz Katılın</h5>
              <p className="text-xs text-charcoal-muted font-medium mt-0.5">İlk seyahatinizde geçerli 500 Hoş Geldin Mili anında cüzdanınıza yüklensin.</p>
            </div>
            <button
              type="button"
              onClick={handleJoinClub}
              className="px-5 py-2.5 rounded-xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-soft flex items-center gap-1.5"
            >
              <span>Kulübe Katıl (+500 Mil)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
