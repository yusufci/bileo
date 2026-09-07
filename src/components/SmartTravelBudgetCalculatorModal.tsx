import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoCheckCircle,
} from './icons';
import { sound } from '../utils/sound';
import { SampleDataNotice } from './common/SampleDataNotice';

interface SmartTravelBudgetCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface BudgetPreset {
  id: string;
  name: string;
  badge: string;
  days: number;
  ticketCost: number;
  localTransitCost: number;
  diningCost: number;
  stayCost: number;
  activityCost: number;
  savingTip: string;
}

const BUDGET_PRESETS: BudgetPreset[] = [
  {
    id: 'student_weekend',
    name: 'Öğrenci & Genç Hafta Sonu Kaçamağı',
    badge: 'Ekonomik Rota',
    days: 2,
    ticketCost: 850,
    localTransitCost: 120,
    diningCost: 650,
    stayCost: 800,
    activityCost: 150,
    savingTip: 'Gece otobüs seferi tercih ederek 1 gece konaklama tasarrufu sağlayabilir ve Müzekart ile tüm ören yerlerine ücretsiz girebilirsiniz.',
  },
  {
    id: 'business_daytrip',
    name: 'İş & Günübirlik Toplantı Seyahati',
    badge: 'Hızlı & Konforlu',
    days: 1,
    ticketCost: 1450,
    localTransitCost: 350,
    diningCost: 750,
    stayCost: 0,
    activityCost: 0,
    savingTip: 'Havalimanı metrosu veya YHT hızlı tren kullanarak şehir içi otoyol ve taksi masraflarını %70 azaltabilirsiniz.',
  },
  {
    id: 'family_holiday',
    name: '4 Kişilik Aile Ege & Akdeniz Tatili',
    badge: 'Geniş Aile Paketi',
    days: 5,
    ticketCost: 4800,
    localTransitCost: 1600,
    diningCost: 5500,
    stayCost: 12000,
    activityCost: 2500,
    savingTip: 'Grup rezervasyonu ve 2+1 otobüs aile koltukları ile uçak biletine kıyasla toplam seyahatte 14.000 ₺ tasarruf elde edebilirsiniz.',
  },
  {
    id: 'cultural_explorer',
    name: 'Kapadokya & Doğu Ekspresi Kültür Turu',
    badge: 'Gezgin Rotası',
    days: 4,
    ticketCost: 2200,
    localTransitCost: 450,
    diningCost: 2400,
    stayCost: 3800,
    activityCost: 1800,
    savingTip: 'TCDD Yataklı Treni tercih ettiğinizde hem panoramik yolculuk deneyimi yaşar hem de yolda 1 gece otel masrafından muaf olursunuz.',
  },
];

export const SmartTravelBudgetCalculatorModal: React.FC<SmartTravelBudgetCalculatorModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('student_weekend');
  const [customDays, setCustomDays] = useState<number>(2);
  const [customTicket, setCustomTicket] = useState<number>(850);
  const [customLocalTransit, setCustomLocalTransit] = useState<number>(120);
  const [customDining, setCustomDining] = useState<number>(650);
  const [customStay, setCustomStay] = useState<number>(800);
  const [customActivity, setCustomActivity] = useState<number>(150);

  if (!isOpen) return null;

  const currentPreset = BUDGET_PRESETS.find((p) => p.id === selectedPresetId) || BUDGET_PRESETS[0];

  const handleApplyPreset = (preset: BudgetPreset) => {
    setSelectedPresetId(preset.id);
    setCustomDays(preset.days);
    setCustomTicket(preset.ticketCost);
    setCustomLocalTransit(preset.localTransitCost);
    setCustomDining(preset.diningCost);
    setCustomStay(preset.stayCost);
    setCustomActivity(preset.activityCost);
    sound.playTick();
  };

  const totalCalculatedBudget =
    customTicket + customLocalTransit + customDining + customStay + customActivity;
  const perDayCost = customDays > 0 ? Math.round(totalCalculatedBudget / customDays) : totalCalculatedBudget;

  const handleCopySummary = () => {
    sound.playSuccess();
    if (onShowToast) {
      onShowToast(
        'Bütçe Planı Kopyalandı',
        `Toplam ${totalCalculatedBudget.toLocaleString('tr-TR')} ₺ tutarındaki seyahat harcama planınız hazırlandı.`,
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
            <div className="w-10 h-10 rounded-2xl bg-bordeaux-50 text-bordeaux-900 flex items-center justify-center border border-bordeaux-200 text-sm font-black font-mono">
              TRY
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Akıllı Seyahat Bütçe Planlayıcısı (örnek)</h3>
              <p className="text-xs text-charcoal-muted font-medium">Bilet, yerel ulaşım, mola yeme-içme ve konaklama için temsili birim fiyatlarla bütçe simülasyonu</p>
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
          
          {/* Preset Selectors */}
          <div className="space-y-2">
            <label className="text-xs font-black text-charcoal uppercase tracking-wider block">
              Hazır Seyahat Profili Seçin
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer shadow-2xs ${
                    selectedPresetId === preset.id
                      ? 'bg-bordeaux-900 text-white border-bordeaux-900 shadow-soft'
                      : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="font-black text-xs truncate">{preset.name.split(' ')[0]} {preset.name.split(' ')[1]}</div>
                  <div className={`text-[10px] font-medium truncate ${selectedPresetId === preset.id ? 'text-rose-200' : 'text-charcoal-muted'}`}>
                    {preset.badge} ({preset.days} Gün)
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Budget Breakdown & Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Input Columns */}
            <div className="md:col-span-2 p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-4">
              <h4 className="text-xs font-black text-charcoal uppercase tracking-wider">Harcama Kalemleri (Türk Lirası)</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-charcoal">Gidiş-Dönüş Bilet Masrafı</label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={customTicket}
                    onChange={(e) => setCustomTicket(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] font-mono font-bold text-charcoal focus:border-bordeaux-700 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-charcoal">Şehir İçi & Havalimanı / Otogar Ulaşımı</label>
                  <input
                    type="number"
                    min={0}
                    step={20}
                    value={customLocalTransit}
                    onChange={(e) => setCustomLocalTransit(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] font-mono font-bold text-charcoal focus:border-bordeaux-700 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-charcoal">Yol & Mola Yeri Yeme-İçme</label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={customDining}
                    onChange={(e) => setCustomDining(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] font-mono font-bold text-charcoal focus:border-bordeaux-700 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-charcoal">Konaklama Masrafı ({customDays} Gece)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={customStay}
                    onChange={(e) => setCustomStay(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] font-mono font-bold text-charcoal focus:border-bordeaux-700 outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-charcoal">Müze, Ören Yeri & Aktivite Bütçesi</label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={customActivity}
                    onChange={(e) => setCustomActivity(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E1D5] font-mono font-bold text-charcoal focus:border-bordeaux-700 outline-none"
                  />
                </div>

              </div>

              {/* Smart Saving Tip Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 font-medium leading-relaxed">
                <span className="font-black text-amber-900 block mb-0.5">Bileo Tasarruf Analizi:</span>
                {currentPreset.savingTip}
              </div>
            </div>

            {/* Summary KPI Column */}
            <div className="p-5 rounded-3xl bg-bordeaux-900 text-white shadow-md flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold text-rose-200 uppercase tracking-wider block">
                  Tahmini Toplam Seyahat Bütçesi
                </span>
                <div className="text-3xl font-black font-mono tracking-tight pt-1">
                  {totalCalculatedBudget.toLocaleString('tr-TR')} ₺
                </div>
                <div className="text-xs text-rose-200 font-medium pt-1">
                  Günlük Ortalama: <strong>{perDayCost.toLocaleString('tr-TR')} ₺ / gün</strong>
                </div>
              </div>

              {/* Progress Distribution */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[11px] text-rose-100">
                  <span>Bilet & Ulaşım Payı</span>
                  <span className="font-mono font-bold">
                    {totalCalculatedBudget > 0
                      ? `${Math.round(((customTicket + customLocalTransit) / totalCalculatedBudget) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{
                      width: totalCalculatedBudget > 0
                        ? `${Math.round(((customTicket + customLocalTransit) / totalCalculatedBudget) * 100)}%`
                        : '0%',
                    }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-rose-100 pt-1">
                  <span>Konaklama & Yaşam</span>
                  <span className="font-mono font-bold">
                    {totalCalculatedBudget > 0
                      ? `${Math.round(((customDining + customStay + customActivity) / totalCalculatedBudget) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-300 h-full rounded-full transition-all duration-300"
                    style={{
                      width: totalCalculatedBudget > 0
                        ? `${Math.round(((customDining + customStay + customActivity) / totalCalculatedBudget) * 100)}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopySummary}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-cream-100 text-bordeaux-950 font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <BileoCheckCircle className="w-3.5 h-3.5" />
                <span>Bütçe Planını Kaydet</span>
              </button>
            </div>

          </div>

          {/* Footer Info */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-charcoal-muted font-medium">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Bileo biletleme motorunda hiçbir gizli servis veya işlem ücreti yansıtılmaz.</span>
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
