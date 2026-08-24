import React, { useState, useMemo } from 'react';
import {
  BileoStar,
  BileoArrowRight,
  BileoChevronRight,
  BileoBus,
  BileoPlane,
  BileoTrain,
  BileoFerry,
  BileoRotateCcw,
  BileoSparkles,
} from './icons';
import { RouteItem, SearchFilterState } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { sound } from '../utils/sound';

interface SearchResultsProps {
  routes: RouteItem[];
  searchState: SearchFilterState;
  onUpdateSearchState: (updates: Partial<SearchFilterState>) => void;
  onSelectRoute: (route: RouteItem) => void;
  onOpenPriceAlert?: (minPrice: number) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  routes,
  searchState,
  onSelectRoute,
  onOpenPriceAlert,
}) => {
  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'otobus': return BileoBus;
      case 'ucak': return BileoPlane;
      case 'tren': return BileoTrain;
      case 'feribot': return BileoFerry;
      default: return BileoBus;
    }
  };

  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [only2Plus1, setOnly2Plus1] = useState(false);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'cheapest' | 'fastest' | 'earliest' | 'rating'>('cheapest');

  // Derive distinct companies for current transport modality
  const currentModalCompanies = useMemo(() => {
    const matched = routes.filter((r) => r.transportType === searchState.transportType);
    return Array.from(new Set(matched.map((r) => r.company)));
  }, [routes, searchState.transportType]);

  const filteredRoutes = useMemo(() => {
    return routes
      .filter((route) => {
        if (route.transportType !== searchState.transportType) return false;

        if (selectedCompanyFilter !== 'all' && route.company !== selectedCompanyFilter) {
          return false;
        }

        if (selectedTimeFilter === 'morning') {
          const hour = parseInt(route.departureTime.split(':')[0], 10);
          if (hour < 6 || hour >= 12) return false;
        } else if (selectedTimeFilter === 'afternoon') {
          const hour = parseInt(route.departureTime.split(':')[0], 10);
          if (hour < 12 || hour >= 18) return false;
        } else if (selectedTimeFilter === 'evening') {
          const hour = parseInt(route.departureTime.split(':')[0], 10);
          if (hour < 18) return false;
        }

        if (only2Plus1 && !route.vehicleType.includes('2+1')) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'cheapest') return a.price - b.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'earliest') return a.departureTime.localeCompare(b.departureTime);
        if (sortBy === 'fastest') return a.duration.localeCompare(b.duration);
        return 0;
      });
  }, [routes, searchState.transportType, selectedTimeFilter, only2Plus1, selectedCompanyFilter, sortBy]);

  const handleResetFilters = () => {
    setSelectedTimeFilter('all');
    setOnly2Plus1(false);
    setSelectedCompanyFilter('all');
    setSortBy('cheapest');
  };

  return (
    <section id="search-results-section" className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Clean & Borderless Results Header & Filter Bar */}
        <div className="pb-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-1">
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-bordeaux-700 uppercase tracking-wider">
                  <span>{searchState.fromCity || 'İstanbul'}</span>
                  <BileoArrowRight className="w-3.5 h-3.5" />
                  <span>{searchState.toCity || 'Ankara'}</span>
                  <span className="text-charcoal-muted">• {searchState.departureDate || '24 Mayıs Cuma'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B18] font-display mt-0.5">
                  Bulunan Seferler ({filteredRoutes.length} Sefer)
                </h2>
              </div>

              {onOpenPriceAlert && filteredRoutes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const min = Math.min(...filteredRoutes.map((r) => r.price));
                    onOpenPriceAlert(min);
                  }}
                  className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-cream-200 hover:bg-cream-300 text-charcoal text-xs font-extrabold transition-colors cursor-pointer"
                  title="Fiyatlar düştüğünde e-posta ile bildirim al"
                >
                  <span>Fiyat Alarmı Kur</span>
                </button>
              )}
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'Tüm Saatler' },
                  { id: 'morning', label: 'Sabah (06:00 - 12:00)' },
                  { id: 'afternoon', label: 'Öğle (12:00 - 18:00)' },
                  { id: 'evening', label: 'Akşam (18:00+)' },
                ].map((time) => (
                  <button
                    key={time.id}
                    type="button"
                    onClick={() => setSelectedTimeFilter(time.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition-colors cursor-pointer ${
                      selectedTimeFilter === time.id
                        ? 'bg-bordeaux-700 text-white shadow-2xs'
                        : 'bg-cream-200 hover:bg-cream-300 text-charcoal'
                    }`}
                  >
                    {time.label}
                  </button>
                ))}

                {searchState.transportType === 'otobus' && (
                  <button
                    type="button"
                    onClick={() => setOnly2Plus1(!only2Plus1)}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition-colors cursor-pointer ${
                      only2Plus1
                        ? 'bg-bordeaux-700 text-white shadow-2xs'
                        : 'bg-cream-200 hover:bg-cream-300 text-charcoal'
                    }`}
                  >
                    Sadece 2+1
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-charcoal-muted font-bold">Sıralama:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-cream-200 hover:bg-cream-300 px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-charcoal focus:outline-none cursor-pointer border-0"
                >
                  <option value="cheapest">En Düşük Fiyat</option>
                  <option value="earliest">En Erken Kalkış</option>
                  <option value="fastest">En Hızlı Sefer</option>
                  <option value="rating">En Yüksek Puanlı</option>
                </select>
              </div>
            </div>

          </div>

          {/* Quick Company Filter Bar */}
          {currentModalCompanies.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3">
              <span className="text-[10px] font-extrabold text-charcoal-muted uppercase shrink-0">Firma:</span>
              <button
                type="button"
                onClick={() => setSelectedCompanyFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  selectedCompanyFilter === 'all'
                    ? 'bg-[#1E1B18] text-white'
                    : 'bg-cream-200 hover:bg-cream-300 text-charcoal'
                }`}
              >
                Tümü ({routes.filter((r) => r.transportType === searchState.transportType).length})
              </button>
              {currentModalCompanies.map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => setSelectedCompanyFilter(comp)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    selectedCompanyFilter === comp
                      ? 'bg-[#1E1B18] text-white'
                      : 'bg-cream-200 hover:bg-cream-300 text-charcoal'
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Routes List or Empty State */}
        {filteredRoutes.length > 0 ? (
          <div className="space-y-4">
            {filteredRoutes.map((route) => {
              return (
                <div
                  key={route.id}
                  className="bg-white rounded-3xl p-6 shadow-soft transition-all hover:shadow-soft-lg border border-[#FAF7F2]"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-3 space-y-2">
                      <div className="h-8 flex items-center">
                        <CompanyLogo
                          company={route.company}
                          transportType={route.transportType}
                          size="lg"
                        />
                      </div>
                      <p className="text-xs text-charcoal-muted font-medium">
                        {route.vehicleType}
                      </p>
                      <div className="flex items-center gap-1 text-xs">
                        <BileoStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-charcoal">{route.rating}</span>
                        <span className="text-[11px] text-charcoal-muted">
                          ({route.reviewCount} Değerlendirme)
                        </span>
                      </div>
                      {route.availableSeats !== undefined && (
                        <div className="pt-0.5">
                          {route.availableSeats <= 6 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200">
                              Son {route.availableSeats} Koltuk • Yoğun Talep
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-800 bg-emerald-50">
                              {route.availableSeats} Boş Koltuk
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-black text-charcoal font-display">
                            {route.departureTime}
                          </span>
                          <p className="text-xs font-bold text-charcoal">{route.from}</p>
                          <p className="text-[10px] text-charcoal-muted truncate max-w-[140px]">
                            {route.fromTerminal}
                          </p>
                        </div>
                        <div className="flex-1 px-4 text-center">
                          <span className="text-[11px] font-bold text-charcoal-muted block">
                            {route.duration}
                          </span>
                          <div className="relative flex items-center justify-center my-1.5 gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-bordeaux-700 flex-shrink-0" />
                            <div className="flex-1 h-[1px] bg-[#E8E1D5]" />
                            {React.createElement(getTransportIcon(route.transportType), {
                              className: 'w-3.5 h-3.5 text-bordeaux-700 flex-shrink-0',
                            })}
                            <div className="flex-1 h-[1px] bg-[#E8E1D5]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-bordeaux-700/40 flex-shrink-0" />
                          </div>
                          <span className="text-[10px] text-charcoal font-bold">
                            Direkt Sefer
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-charcoal font-display">
                            {route.arrivalTime}
                          </span>
                          <p className="text-xs font-bold text-charcoal">{route.to}</p>
                          <p className="text-[10px] text-charcoal-muted truncate max-w-[140px]">
                            {route.toTerminal}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 hidden xl:flex flex-col gap-1 text-[11px] text-charcoal-muted pl-2">
                      <span>220V Priz & USB</span>
                      <span>Ücretsiz Wi-Fi</span>
                      <span>İkram Servisi</span>
                    </div>

                    <div className="lg:col-span-4 xl:col-span-2 flex lg:flex-col items-center lg:items-end justify-between gap-3 pt-2 lg:pt-0">
                      <div>
                        <span className="text-[10px] text-charcoal-muted block text-left lg:text-right">Bilet Fiyatı</span>
                        <span className="text-2xl font-black text-charcoal font-display">
                          {route.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playTick();
                          onSelectRoute(route);
                        }}
                        className="px-6 py-3.5 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-bordeaux cursor-pointer transition-all flex items-center justify-center gap-2 min-h-[46px] hover:shadow-md"
                      >
                        <span>Bilet Al / İncele</span>
                        <BileoChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E1D5] space-y-4 shadow-soft">
            <div className="w-16 h-16 rounded-full bg-cream-100 text-bordeaux-700 flex items-center justify-center mx-auto">
              <BileoSparkles className="w-8 h-8" />
            </div>
            <div className="text-lg font-black text-[#1E1B18] font-display">
              Seçilen Filtrelerle Eşleşen Sefer Bulunamadı
            </div>
            <p className="text-xs text-charcoal-muted max-w-md mx-auto">
              Uyguladığınız saat, firma veya 2+1 koltuk filtrelerine uygun sefer bulunamadı. Filtreleri temizleyerek tüm seferleri görüntüleyebilirsiniz.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-5 py-2.5 rounded-2xl bg-bordeaux-700 hover:bg-bordeaux-800 text-white text-xs font-bold shadow-bordeaux flex items-center gap-2 mx-auto cursor-pointer transition-colors"
            >
              <BileoRotateCcw className="w-4 h-4" />
              <span>Filtreleri Temizle</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
