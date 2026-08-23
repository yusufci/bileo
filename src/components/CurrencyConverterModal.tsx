import React, { useState } from 'react';
import { BileoClose, BileoArrowRightLeft } from './icons';
import { sound } from '../utils/sound';

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CurrencyRate {
  code: 'TRY' | 'USD' | 'EUR' | 'GBP' | 'SAR';
  name: string;
  symbol: string;
  flag: string;
  rateToTRY: number; // 1 Foreign = X TRY
}

const RATES: CurrencyRate[] = [
  { code: 'TRY', name: 'Türk Lirası', symbol: '₺', flag: '🇹🇷', rateToTRY: 1.0 },
  { code: 'USD', name: 'Amerikan Doları', symbol: '$', flag: '🇺🇸', rateToTRY: 38.5 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateToTRY: 41.8 },
  { code: 'GBP', name: 'İngiliz Sterlini', symbol: '£', flag: '🇬🇧', rateToTRY: 49.2 },
  { code: 'SAR', name: 'Suudi Riyali', symbol: '﷼', flag: '🇸🇦', rateToTRY: 10.25 },
];

export const CurrencyConverterModal: React.FC<CurrencyConverterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [amount, setAmount] = useState<number>(850);
  const [sourceCurrency, setSourceCurrency] = useState<CurrencyRate['code']>('TRY');

  if (!isOpen) return null;

  const sourceRate = RATES.find((r) => r.code === sourceCurrency) || RATES[0];
  const tryEquivalent = amount * sourceRate.rateToTRY;

  const handleSourceChange = (code: CurrencyRate['code']) => {
    sound.playTick();
    setSourceCurrency(code);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <BileoArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Çoklu Para Birimi Dönüştürücü</h3>
              <p className="text-xs text-charcoal-muted font-medium">Bilet ücretlerini döviz cinsinden anında hesaplayın</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Amount Input */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8E1D5] space-y-2">
            <label className="text-xs font-bold text-charcoal block">Bilet Tutarı / Miktar</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={50000}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E1D5] text-lg font-black text-[#1E1B18] focus:ring-2 focus:ring-bordeaux-700 outline-none"
              />
              <span className="text-lg font-black text-bordeaux-700 font-display px-2">{sourceRate.symbol}</span>
            </div>
          </div>

          {/* Source Currency Select */}
          <div>
            <label className="text-xs font-bold text-charcoal mb-2 block">Giriş Para Birimi</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {RATES.map((rate) => (
                <button
                  key={rate.code}
                  type="button"
                  onClick={() => handleSourceChange(rate.code)}
                  className={`p-2.5 rounded-xl text-center border text-xs font-extrabold transition-all cursor-pointer ${
                    sourceCurrency === rate.code
                      ? 'bg-bordeaux-700 text-white border-bordeaux-700 shadow-soft'
                      : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <span className="text-base block mb-0.5">{rate.flag}</span>
                  <span>{rate.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Converted Currencies Table */}
          <div className="bg-white rounded-2xl border border-[#E8E1D5] divide-y divide-[#FAF7F2] overflow-hidden">
            <div className="p-3 bg-[#FAF7F2] text-[10px] font-extrabold text-charcoal-muted uppercase tracking-wider">
              Döviz Eşdeğerleri (Güncel TCMB / Serbest Piyasa Kurları)
            </div>
            {RATES.map((rate) => {
              const convertedValue = (tryEquivalent / rate.rateToTRY).toFixed(2);
              const isSelected = rate.code === sourceCurrency;

              return (
                <div
                  key={rate.code}
                  className={`p-3.5 flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-amber-50/50 font-black' : 'hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{rate.flag}</span>
                    <div>
                      <span className="text-xs font-bold text-[#1E1B18] block">{rate.name}</span>
                      <span className="text-[10px] text-charcoal-muted font-mono">1 {rate.code} = {rate.rateToTRY} ₺</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-bordeaux-700 font-display">
                      {convertedValue} {rate.symbol}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-white border-t border-[#E8E1D5] flex items-center justify-between text-[11px] text-charcoal-muted">
          <span>* Kurlar gösterge niteliğindedir. Ödemeler Türk Lirası (₺) cinsinden tahsil edilir.</span>
        </div>

      </div>
    </div>
  );
};
