import React, { useRef } from 'react';
import { BileoChevronLeft, BileoChevronRight, BileoArrowRight } from './icons';
import { DiscoveryCardItem } from '../types';
import { DISCOVERY_CARDS } from '../data/mockData';
import { CompanyLogo } from './CompanyLogo';

interface DiscoveryCarouselProps {
  onSelectRoute: (card: DiscoveryCardItem) => void;
}

export const DiscoveryCarousel: React.FC<DiscoveryCarouselProps> = ({ onSelectRoute }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 pb-3">
          <div>
            <span className="text-[11px] font-black text-bordeaux-700 uppercase tracking-widest block mb-1">
              ÖNE ÇIKAN SEYAHATLER
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B18] font-display tracking-tight">
              Popüler Sefer ve Rotalar
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-0.5 font-medium">
              Doğrudan seferler ve avantajlı başlangıç fiyatları
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => handleScroll('left')}
              className="w-9 h-9 rounded-full bg-white hover:bg-[#FAF7F2] text-charcoal shadow-soft flex items-center justify-center transition-colors cursor-pointer"
              title="Önceki Rotalar"
            >
              <BileoChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="w-9 h-9 rounded-full bg-white hover:bg-[#FAF7F2] text-charcoal shadow-soft flex items-center justify-center transition-colors cursor-pointer"
              title="Sonraki Rotalar"
            >
              <BileoChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Typographic Route Cards (Photo-Free, Line-Free, Capsule-Free) */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-5 overflow-x-auto no-scrollbar pb-4 pt-1 snap-x snap-mandatory"
        >
          {DISCOVERY_CARDS.map((card) => {
            return (
              <div
                key={card.id}
                onClick={() => onSelectRoute(card)}
                className="flex-shrink-0 w-64 sm:w-72 p-5 rounded-2xl bg-white hover:bg-[#FAF7F2] shadow-soft hover:shadow-soft-lg transition-all cursor-pointer snap-start flex flex-col justify-between select-none"
              >
                <div>
                  {/* Top Row: Authentic Company Logo & Time */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-6 flex items-center">
                      <CompanyLogo
                        company={card.company}
                        transportType={card.transportType}
                        size="md"
                      />
                    </div>
                    <span className="text-xs font-bold text-charcoal-muted">
                      {card.time}
                    </span>
                  </div>

                  {/* Clean IATA / City Route (Zero Badges / Zero Pill Backgrounds) */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-charcoal-muted mb-1">
                    <span>{card.cityCodeFrom || 'IST'}</span>
                    <BileoArrowRight className="w-3.5 h-3.5 text-bordeaux-700" />
                    <span>{card.cityCodeTo || 'IZM'}</span>
                    <span className="text-[10px] font-sans font-medium text-charcoal-muted/70 ml-1">
                      • {card.duration || 'Direkt'}
                    </span>
                  </div>

                  {/* Destination City Names */}
                  <div className="flex items-center gap-2 text-lg font-black text-[#1E1B18] font-display">
                    <span>{card.from}</span>
                    <BileoArrowRight className="w-4 h-4 text-bordeaux-700 flex-shrink-0" />
                    <span>{card.to}</span>
                  </div>

                  {/* Vehicle Model Subtitle */}
                  <p className="text-xs text-charcoal-muted font-medium mt-1 truncate">
                    {card.vehicleModel || card.regionTag || 'Doğrudan Konforlu Sefer'}
                  </p>
                </div>

                {/* Price & Borderless Action Row */}
                <div className="pt-4 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black text-charcoal-muted uppercase tracking-widest block">
                      BAŞLAYAN FİYATLARLA
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-bordeaux-700 font-display">
                        {card.price.toLocaleString('tr-TR')}
                      </span>
                      <span className="text-xs font-black text-bordeaux-700 font-display">TL</span>
                    </div>
                  </div>

                  {/* Borderless & Backgroundless Action */}
                  <div className="text-xs font-extrabold text-charcoal hover:text-bordeaux-700 flex items-center gap-1 transition-colors">
                    <span>Sefer Bul</span>
                    <BileoChevronRight className="w-3.5 h-3.5 text-bordeaux-700" />
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
