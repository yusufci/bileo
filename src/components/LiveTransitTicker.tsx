import React from 'react';

interface TickerItem {
  id: string;
  category: string;
  text: string;
  highlight?: string;
  timeAgo: string;
}

const TICKER_ITEMS: TickerItem[] = [
  {
    id: 't1',
    category: 'YHT & DEMİRYOLU',
    text: 'İstanbul — Ankara Hızlı Tren ek seferleri açıldı',
    highlight: '0 TL Komisyon',
    timeAgo: 'Az önce',
  },
  {
    id: 't2',
    category: 'OTOBÜS AĞI',
    text: 'Pamukkale & Kamil Koç Jumbo 2+1 seferlerinde',
    highlight: 'Koşulsuz Kesintisiz İade',
    timeAgo: '2 dk önce',
  },
  {
    id: 't3',
    category: 'HAVACILIK',
    text: 'Türk Hava Yolları & Pegasus erken rezervasyon fırsatları aktif',
    highlight: 'Yaz Tarifesi',
    timeAgo: '4 dk önce',
  },
  {
    id: 't4',
    category: 'CANLI İSTATİSTİK',
    text: 'Bugün 3.240 yolcu güvenle biletini ayırttı',
    highlight: '256-Bit SSL Koruma',
    timeAgo: 'Canlı',
  },
  {
    id: 't5',
    category: 'MARMARA DENİZ HATTI',
    text: 'İDO & BUDO Bursa — Yenikapı hızlı katamaran seferleri güncellendi',
    highlight: 'Günde 32 Sefer',
    timeAgo: '8 dk önce',
  },
  {
    id: 't6',
    category: 'KONFOR STANDARDI',
    text: 'Tüm 2+1 otobüslerde geniş bacak mesafesi ve 220V priz garantisi',
    highlight: 'VIP Seyahat',
    timeAgo: '12 dk önce',
  },
];

export const LiveTransitTicker: React.FC = () => {
  return (
    <div className="bg-[#FAF7F2] overflow-hidden select-none py-2.5">
      <div className="w-full overflow-hidden">
        {/* Continuous Smooth Scrolling Marquee Tape */}
        <div className="relative overflow-hidden w-full">
          <div className="flex items-center gap-8 whitespace-nowrap animate-ticker-marquee cursor-default">
            {/* First Set */}
            {TICKER_ITEMS.map((item) => (
              <div key={item.id} className="inline-flex items-center gap-2 text-xs font-medium text-charcoal">
                <span className="text-[10px] font-black text-charcoal-muted uppercase tracking-wider">
                  [{item.category}]
                </span>
                <span className="font-semibold text-[#1E1B18]">{item.text}</span>
                {item.highlight && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-charcoal shadow-2xs">
                    {item.highlight}
                  </span>
                )}
                <span className="text-[10px] text-charcoal-muted font-normal">• {item.timeAgo}</span>
                <span className="text-[#E2DCD2] font-bold mx-2">/</span>
              </div>
            ))}

            {/* Duplicated Set for Seamless Infinite Loop */}
            {TICKER_ITEMS.map((item) => (
              <div key={`dup-${item.id}`} className="inline-flex items-center gap-2 text-xs font-medium text-charcoal">
                <span className="text-[10px] font-black text-charcoal-muted uppercase tracking-wider">
                  [{item.category}]
                </span>
                <span className="font-semibold text-[#1E1B18]">{item.text}</span>
                {item.highlight && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-charcoal shadow-2xs">
                    {item.highlight}
                  </span>
                )}
                <span className="text-[10px] text-charcoal-muted font-normal">• {item.timeAgo}</span>
                <span className="text-[#E2DCD2] font-bold mx-2">/</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
