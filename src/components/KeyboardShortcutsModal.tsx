import React from 'react';
import { BileoClose, BileoSparkles } from './icons';

interface ShortcutItem {
  keyCombo: string[];
  description: string;
  category: 'Gezinme' | 'Mod Seçimi' | 'Hızlı Eylemler';
}

const SHORTCUTS: ShortcutItem[] = [
  { keyCombo: ['1'], description: 'Karayolu / Otobüs Seferleri', category: 'Mod Seçimi' },
  { keyCombo: ['2'], description: 'Havayolu / Uçak Seferleri', category: 'Mod Seçimi' },
  { keyCombo: ['3'], description: 'Demiryolu / Hızlı Tren', category: 'Mod Seçimi' },
  { keyCombo: ['4'], description: 'Denizyolu / Hızlı Feribot', category: 'Mod Seçimi' },
  { keyCombo: ['W'], description: 'Bilet Cüzdanı ve Biniş Kartları', category: 'Hızlı Eylemler' },
  { keyCombo: ['P'], description: 'PNR Sorgulama & Bilet İptal Portalı', category: 'Hızlı Eylemler' },
  { keyCombo: ['T'], description: 'Terminal & İstasyon Rehberi', category: 'Hızlı Eylemler' },
  { keyCombo: ['?'], description: 'Klavye Kısayolları Yardım Rehberi', category: 'Gezinme' },
  { keyCombo: ['Esc'], description: 'Açık Modalı Kapat', category: 'Gezinme' },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const categories = ['Mod Seçimi', 'Hızlı Eylemler', 'Gezinme'] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cream-100 text-bordeaux-700 flex items-center justify-center border border-[#E8E1D5]">
              <BileoSparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Klavye Kısayolları</h3>
              <p className="text-xs text-charcoal-muted font-medium">Bileo'da hızlı gezinme ve tek tuşla erişim</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 overflow-y-auto space-y-6">
          {categories.map((cat) => {
            const items = SHORTCUTS.filter((s) => s.category === cat);
            return (
              <div key={cat} className="space-y-2.5">
                <span className="text-[11px] font-extrabold text-charcoal-muted uppercase tracking-wider block">
                  {cat}
                </span>
                <div className="space-y-2 bg-white p-3 rounded-2xl border border-[#E8E1D5]">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5 px-2 text-xs"
                    >
                      <span className="font-bold text-[#1E1B18]">{item.description}</span>
                      <div className="flex items-center gap-1">
                        {item.keyCombo.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-1 rounded-lg bg-[#FAF7F2] border border-[#D9D2C5] text-[11px] font-mono font-black text-bordeaux-700 shadow-2xs min-w-[24px] text-center"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-4 bg-white/70 border-t border-[#E8E1D5] flex items-center justify-between text-xs text-charcoal-muted">
          <span>İstediğiniz an <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#D9D2C5] font-mono font-bold text-charcoal">?</kbd> tuşuna basarak bu pencereyi açabilirsiniz.</span>
        </div>

      </div>
    </div>
  );
};
