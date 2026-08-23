import React from 'react';
import { CompanyLogo } from './CompanyLogo';
import { TransportType } from '../types';

interface WhyBileoSectionProps {
  onSelectCarrier?: (carrier: string, type: TransportType) => void;
  onOpenFareMatrix?: () => void;
}

export const WhyBileoSection: React.FC<WhyBileoSectionProps> = ({ onSelectCarrier, onOpenFareMatrix }) => {
  const modes = [
    {
      id: 'otobus',
      title: 'Karayolu',
      subtitle: '2+1 & 2+2 Hatlar',
      type: 'otobus' as TransportType,
      carriers: ['Kamil Koç', 'Pamukkale Turizm', 'Varan Turizm', 'Ali Osman Ulusoy'],
    },
    {
      id: 'ucak',
      title: 'Havayolu',
      subtitle: 'Yurt İçi & Yurt Dışı',
      type: 'ucak' as TransportType,
      carriers: ['Türk Hava Yolları', 'Pegasus', 'SunExpress', 'AJet'],
    },
    {
      id: 'tren',
      title: 'Demiryolu',
      subtitle: 'Yüksek Hızlı Tren',
      type: 'tren' as TransportType,
      carriers: ['TCDD Taşımacılık'],
    },
    {
      id: 'feribot',
      title: 'Denizyolu',
      subtitle: 'Hızlı Deniz Otobüsü',
      type: 'feribot' as TransportType,
      carriers: ['İDO (İstanbul Deniz Otobüsleri)', 'BUDO Express', 'Gestaş'],
    },
  ];

  return (
    <section className="py-10 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header - Dot-Free, Calm Editorial with Fare Matrix Trigger */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B18] font-display tracking-tight">
              Türkiye'nin Öncü Sefer Ağları
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-1 font-medium">
              Doğrudan firma entegrasyonuyla 0 TL gizli hizmet bedeli ve anında resmi PNR biniş kartı
            </p>
          </div>

          {onOpenFareMatrix && (
            <button
              onClick={onOpenFareMatrix}
              className="self-start md:self-auto text-xs font-extrabold text-bordeaux-700 hover:text-bordeaux-900 bg-white hover:bg-cream-100 border border-[#E8E1D5] px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Çok Modlu Karşılaştırma & Süre Tablosu ➔</span>
            </button>
          )}
        </div>

        {/* 4 Balanced Grid Columns (Zero Dots, Zero Clutter, Zero Hover Jumping) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {modes.map((mode) => {
            return (
              <div
                key={mode.id}
                className="flex flex-col justify-start space-y-4"
              >
                {/* Mode Title (Pure Typography, Zero Icons) */}
                <div className="pb-2">
                  <h3 className="text-sm font-bold text-[#1E1B18] tracking-tight">
                    {mode.title}
                  </h3>
                  <span className="text-[11px] text-charcoal-muted font-medium block">
                    {mode.subtitle}
                  </span>
                </div>

                {/* Vertical Clean Logo Stack */}
                <div className="space-y-4">
                  {mode.carriers.map((companyName) => (
                    <div
                      key={companyName}
                      onClick={() => onSelectCarrier && onSelectCarrier(companyName, mode.type)}
                      className={`h-7 flex items-center justify-start cursor-pointer ${
                        onSelectCarrier ? 'opacity-90 hover:opacity-100' : ''
                      }`}
                    >
                      <CompanyLogo
                        company={companyName}
                        transportType={mode.type}
                        size="md"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
