import React, { useState } from 'react';
import { renderBrandSVG } from './PartnerLogosRibbon';
import { TransportType } from '../types';
import { BileoChevronRight } from './icons';

interface FeaturedCarrier {
  id: string;
  name: string;
  category: TransportType;
  tag: string;
  fleet: string;
  routes: string;
  highlights: string[];
  dailyTrips: string;
  satisfactionRate: string;
}

const FEATURED_CARRIERS: FeaturedCarrier[] = [
  {
    id: 'thy',
    name: 'Turkish Airlines',
    category: 'ucak',
    tag: 'Milli Bayrak Taşıyıcı',
    fleet: 'Airbus A350 & Boeing 787-9 Dreamliner',
    routes: 'İstanbul • Ankara • İzmir • Antalya • Trabzon',
    highlights: ['Gourmet İkram', 'Miles&Smiles', 'Yüksek Hızlı Wi-Fi'],
    dailyTrips: '320+ Günlük Sefer',
    satisfactionRate: '4.9',
  },
  {
    id: 'pamukkale',
    name: 'Pamukkale Turizm',
    category: 'otobus',
    tag: 'Jumbo 2+1 Konsepti',
    fleet: 'Setra TopClass & Neoplan Tourliner 2+1',
    routes: 'İzmir • İstanbul • Bursa • Denizli • Muğla',
    highlights: ['Geniş Koltuk Aralığı', '220V Priz & USB', 'Özel Araç İçi İkram'],
    dailyTrips: '180+ Günlük Sefer',
    satisfactionRate: '4.8',
  },
  {
    id: 'tcdd',
    name: 'TCDD YHT',
    category: 'tren',
    tag: 'Yüksek Hızlı Demiryolu',
    fleet: 'Siemens Velaro & CAF YHT (300 km/s)',
    routes: 'Ankara • İstanbul • Konya • Eskişehir • Sivas',
    highlights: ['300 km/s Hız', 'Yemekli Vagon Servisi', 'Business & Ekonomi'],
    dailyTrips: '48+ Günlük Sefer',
    satisfactionRate: '4.9',
  },
  {
    id: 'kamilkoc',
    name: 'Kamil Koç',
    category: 'otobus',
    tag: 'Türkiye’nin İlk Otobüs Ağı',
    fleet: 'Mercedes-Benz Travego 16 SHD & Tourismo',
    routes: 'Ankara • İstanbul • Antalya • İzmir • Bursa',
    highlights: ['Rahat Hat 2+1', 'Kesintisiz Wi-Fi', 'Sıcak & Soğuk Servis'],
    dailyTrips: '210+ Günlük Sefer',
    satisfactionRate: '4.7',
  },
  {
    id: 'pegasus',
    name: 'Pegasus Airlines',
    category: 'ucak',
    tag: 'Avantajlı Uçuş Ağı',
    fleet: 'Airbus A321neo & A320neo Çevre Dostu Filo',
    routes: 'Sabiha Gökçen • Bodrum • Dalaman • İzmir • Adana',
    highlights: ['Esnek Flex Bilet', 'BolBol Puan', 'Hızlı Biniş Önceliği'],
    dailyTrips: '190+ Günlük Sefer',
    satisfactionRate: '4.7',
  },
  {
    id: 'ido',
    name: 'İDO',
    category: 'feribot',
    tag: 'Marmara Hızlı Deniz Hatları',
    fleet: 'Hızlı Katamaran & Yüksek Kapasiteli Hızlı Feribot',
    routes: 'Yenikapı • Bursa • Bandırma • Kadıköy • Yalova',
    highlights: ['Kısa Sürede Ulaşım', 'Araç & Yolcu Taşıma', 'Açık Güverte & Büfe'],
    dailyTrips: '64+ Günlük Sefer',
    satisfactionRate: '4.8',
  },
];

interface FeaturedCarriersShowcaseProps {
  onSelectCarrier: (carrierName: string, transportType: TransportType) => void;
  onOpenFleetModal?: () => void;
}

export const FeaturedCarriersShowcase: React.FC<FeaturedCarriersShowcaseProps> = ({
  onSelectCarrier,
  onOpenFleetModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | TransportType>('all');

  const filteredCarriers =
    activeCategory === 'all'
      ? FEATURED_CARRIERS
      : FEATURED_CARRIERS.filter((c) => c.category === activeCategory);

  return (
    <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header with Description & Fleet Modal Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-bordeaux-700 uppercase tracking-wider">Premium Filolar</span>
            {onOpenFleetModal && (
              <button
                type="button"
                onClick={onOpenFleetModal}
                className="px-2.5 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-extrabold transition-colors cursor-pointer"
              >
                Araç & Koltuk Standartları ➔
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-charcoal dark:text-[#F5F2EB]-muted dark:text-[#A39E98] max-w-2xl font-normal leading-relaxed">
            Resmi biletleme güvencesiyle 500+ karayolu, havayolu, demiryolu ve denizyolu taşıyıcısının en son teknoloji araç filoları tek ekranda.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#FAF7F2] dark:bg-[#211D1A] p-1.5 rounded-2xl border border-[#E8E1D5] dark:border-[#2E2A27] self-start md:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-white dark:bg-[#2E2A27] text-charcoal dark:text-[#F5F2EB] dark:text-[#F5F2EB] shadow-soft'
                : 'text-charcoal dark:text-[#F5F2EB]-muted dark:text-[#A39E98] hover:text-charcoal dark:text-[#F5F2EB]'
            }`}
          >
            Tüm Taşıyıcılar
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('otobus')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === 'otobus'
                ? 'bg-white dark:bg-[#2E2A27] text-charcoal dark:text-[#F5F2EB] dark:text-[#F5F2EB] shadow-soft'
                : 'text-charcoal dark:text-[#F5F2EB]-muted dark:text-[#A39E98] hover:text-charcoal dark:text-[#F5F2EB]'
            }`}
          >
            Otobüs Filoları
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('ucak')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === 'ucak'
                ? 'bg-white dark:bg-[#2E2A27] text-charcoal dark:text-[#F5F2EB] dark:text-[#F5F2EB] shadow-soft'
                : 'text-charcoal dark:text-[#F5F2EB]-muted dark:text-[#A39E98] hover:text-charcoal dark:text-[#F5F2EB]'
            }`}
          >
            Havayolları
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('tren')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === 'tren'
                ? 'bg-white dark:bg-[#2E2A27] text-charcoal dark:text-[#F5F2EB] dark:text-[#F5F2EB] shadow-soft'
                : 'text-charcoal dark:text-[#F5F2EB]-muted dark:text-[#A39E98] hover:text-charcoal dark:text-[#F5F2EB]'
            }`}
          >
            Hızlı Tren & Deniz
          </button>
        </div>
      </div>

      {/* Carrier Showcase Grid (Sade, Şık, Logolar Ön Planda, Sıfır Arka Plan / Sıfır İkon) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCarriers.map((carrier) => (
          <div
            key={carrier.id}
            className="group bg-white dark:bg-[#1C1917] border border-[#E8E1D5] dark:border-[#2E2A27] rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-200 flex flex-col justify-between select-none"
          >
            {/* Top Row: Authentic SVG Brand Logo & Category Tag */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="h-8 flex items-center">
                  {renderBrandSVG(carrier.name)}
                </div>
                <span className="text-[11px] font-bold text-charcoal dark:text-[#F5F2EB]-muted dark:text-[#A39E98]">
                  {carrier.tag}
                </span>
              </div>

              {/* Fleet & Model Info */}
              <div className="space-y-1 mb-4">
                <div className="text-[10px] font-bold text-charcoal dark:text-[#F5F2EB]-muted dark:text-[#A39E98] uppercase tracking-wider">
                  Filo & Araç Donanımı
                </div>
                <div className="text-xs font-bold text-[#1E1B18] leading-snug">
                  {carrier.fleet}
                </div>
              </div>

              {/* Popular Transit Corridor */}
              <div className="space-y-1 mb-4">
                <div className="text-[10px] font-bold text-charcoal dark:text-[#F5F2EB]-muted dark:text-[#A39E98] uppercase tracking-wider">
                  Ana Hatlar & Güzergahlar
                </div>
                <div className="text-xs font-medium text-charcoal dark:text-[#F5F2EB] truncate">
                  {carrier.routes}
                </div>
              </div>

              {/* Feature Highlights Text List (Sade, İkonsuz & Arka Plansız) */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-6 text-[11px] text-charcoal dark:text-[#F5F2EB]-muted dark:text-[#A39E98] font-medium">
                {carrier.highlights.map((highlight, idx) => (
                  <React.Fragment key={idx}>
                    <span>{highlight}</span>
                    {idx < carrier.highlights.length - 1 && <span>•</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Bottom Action & Satisfaction Strip */}
            <div className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-charcoal dark:text-[#F5F2EB] font-display">
                  ★ {carrier.satisfactionRate}
                </span>
                <span className="text-[11px] text-charcoal dark:text-[#F5F2EB]-muted dark:text-[#A39E98] font-medium">
                  • {carrier.dailyTrips}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSelectCarrier(carrier.name, carrier.category)}
                className="inline-flex items-center gap-1.5 text-xs font-black text-charcoal dark:text-[#F5F2EB] hover:text-bordeaux-700 transition-colors cursor-pointer"
              >
                <span>Seferleri Gör</span>
                <BileoChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>
        ))}
      </div>
    </section>
  );
};

