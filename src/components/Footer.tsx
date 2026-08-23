import React from 'react';
import { BileoShieldCheck, BileoHeart } from './icons';
import { SeferLogo } from './SeferLogo';

interface FooterProps {
  onOpenEcoModal?: () => void;
  onOpenTerminalGuide?: () => void;
  onOpenCurrencyModal?: () => void;
  onOpenLuggageModal?: () => void;
  onOpenWeatherModal?: () => void;
  onOpenShuttleModal?: () => void;
  onOpenPetModal?: () => void;
  onOpenInsuranceModal?: () => void;
  onOpenTaxiModal?: () => void;
  onOpenRestStopModal?: () => void;
  onOpenDiscountsModal?: () => void;
  onOpenStorageModal?: () => void;
  onOpenTrackerModal?: () => void;
  onOpenCateringModal?: () => void;
  onOpenAccessibilityModal?: () => void;
  onOpenStudentModal?: () => void;
  onOpenTechModal?: () => void;
  onOpenLostFoundModal?: () => void;
  onOpenHighwayModal?: () => void;
  onOpenGroupModal?: () => void;
  onOpenMedicalModal?: () => void;
  onOpenRouteStopsModal?: () => void;
  onOpenRightsModal?: () => void;
  onOpenGuidesModal?: () => void;
  onOpenRewardsModal?: () => void;
  onOpenRadarModal?: () => void;
  onOpenCampusModal?: () => void;
  onOpenCompareModal?: () => void;
  onOpenCityCardModal?: () => void;
  onOpenOvernightModal?: () => void;
  onOpenSkiModal?: () => void;
  onOpenSeasonsModal?: () => void;
  onOpenFlightRadarModal?: () => void;
  onOpenAirportMetroModal?: () => void;
  onOpenRouteNetworkModal?: () => void;
  onOpenOccupancyModal?: () => void;
  onOpenProvincesModal?: () => void;
  onOpenTransfersModal?: () => void;
  onOpenSeatComfortModal?: () => void;
  onOpenRescheduleModal?: () => void;
  onOpenEntertainmentModal?: () => void;
  onOpenParcelModal?: () => void;
  onOpenSleeperTrainModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenEcoModal,
  onOpenTerminalGuide,
  onOpenCurrencyModal,
  onOpenLuggageModal,
  onOpenWeatherModal,
  onOpenShuttleModal,
  onOpenPetModal,
  onOpenInsuranceModal,
  onOpenTaxiModal,
  onOpenRestStopModal,
  onOpenDiscountsModal,
  onOpenStorageModal,
  onOpenTrackerModal,
  onOpenCateringModal,
  onOpenAccessibilityModal,
  onOpenStudentModal,
  onOpenTechModal,
  onOpenLostFoundModal,
  onOpenHighwayModal,
  onOpenGroupModal,
  onOpenMedicalModal,
  onOpenRouteStopsModal,
  onOpenRightsModal,
  onOpenGuidesModal,
  onOpenRewardsModal,
  onOpenRadarModal,
  onOpenCampusModal,
  onOpenCompareModal,
  onOpenCityCardModal,
  onOpenOvernightModal,
  onOpenSkiModal,
  onOpenSeasonsModal,
  onOpenFlightRadarModal,
  onOpenAirportMetroModal,
  onOpenRouteNetworkModal,
  onOpenOccupancyModal,
  onOpenProvincesModal,
  onOpenTransfersModal,
  onOpenSeatComfortModal,
  onOpenRescheduleModal,
  onOpenEntertainmentModal,
  onOpenParcelModal,
  onOpenSleeperTrainModal,
}) => {
  return (
    <footer className="bg-white pt-16 pb-24 sm:pb-16 text-charcoal-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <SeferLogo size="md" variant="bordeaux" showTagline={true} />
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-sm leading-relaxed">
              Yolculuğun en keyifli, en dürüst ve en zarif hali. Otobüs, uçak, hızlı tren ve feribot biletlerini sıfır gizli masrafla saniyeler içinde alın.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-charcoal">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>TÜRSAB Onaylı & 256-Bit SSL Güvenli Altyapı</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {onOpenEcoModal && (
                <button
                  type="button"
                  onClick={onOpenEcoModal}
                  className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
                >
                  <span>🌱 Eko-Hesaplayıcı</span>
                </button>
              )}
              {onOpenCurrencyModal && (
                <button
                  type="button"
                  onClick={onOpenCurrencyModal}
                  className="text-xs font-extrabold text-amber-800 hover:text-amber-900 flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
                >
                  <span>💱 Döviz</span>
                </button>
              )}
              {onOpenLuggageModal && (
                <button
                  type="button"
                  onClick={onOpenLuggageModal}
                  className="text-xs font-extrabold text-blue-800 hover:text-blue-900 flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
                >
                  <span>🧳 Bagaj</span>
                </button>
              )}
              {onOpenWeatherModal && (
                <button
                  type="button"
                  onClick={onOpenWeatherModal}
                  className="text-xs font-extrabold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 cursor-pointer bg-amber-50/80 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
                >
                  <span>☀️ Hava</span>
                </button>
              )}
              {onOpenShuttleModal && (
                <button
                  type="button"
                  onClick={onOpenShuttleModal}
                  className="text-xs font-extrabold text-bordeaux-700 hover:text-bordeaux-800 flex items-center gap-1.5 cursor-pointer bg-cream-100 hover:bg-cream-200 px-3 py-1.5 rounded-xl border border-[#E8E1D5] transition-colors"
                >
                  <span>🚐 Servis</span>
                </button>
              )}
              {onOpenPetModal && (
                <button
                  type="button"
                  onClick={onOpenPetModal}
                  className="text-xs font-extrabold text-rose-800 hover:text-rose-900 flex items-center gap-1.5 cursor-pointer bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors"
                >
                  <span>🐾 Pati</span>
                </button>
              )}
              {onOpenInsuranceModal && (
                <button
                  type="button"
                  onClick={onOpenInsuranceModal}
                  className="text-xs font-extrabold text-emerald-800 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
                >
                  <span>🛡️ Sigorta</span>
                </button>
              )}
              {onOpenTaxiModal && (
                <button
                  type="button"
                  onClick={onOpenTaxiModal}
                  className="text-xs font-extrabold text-amber-800 hover:text-amber-900 flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
                >
                  <span>🚕 Taksi</span>
                </button>
              )}
              {onOpenRestStopModal && (
                <button
                  type="button"
                  onClick={onOpenRestStopModal}
                  className="text-xs font-extrabold text-amber-900 hover:text-amber-950 flex items-center gap-1.5 cursor-pointer bg-amber-50/90 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 transition-colors"
                >
                  <span>🍽️ Mola</span>
                </button>
              )}
              {onOpenDiscountsModal && (
                <button
                  type="button"
                  onClick={onOpenDiscountsModal}
                  className="text-xs font-extrabold text-bordeaux-700 hover:text-bordeaux-800 flex items-center gap-1.5 cursor-pointer bg-cream-100 hover:bg-cream-200 px-3 py-1.5 rounded-xl border border-[#E8E1D5] transition-colors"
                >
                  <span>🎟️ İndirimler</span>
                </button>
              )}
              {onOpenStorageModal && (
                <button
                  type="button"
                  onClick={onOpenStorageModal}
                  className="text-xs font-extrabold text-blue-800 hover:text-blue-900 flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
                >
                  <span>🛅 Emanet</span>
                </button>
              )}
              {onOpenTrackerModal && (
                <button
                  type="button"
                  onClick={onOpenTrackerModal}
                  className="text-xs font-extrabold text-emerald-800 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
                >
                  <span>🛰️ Canlı Takip</span>
                </button>
              )}
              {onOpenCateringModal && (
                <button
                  type="button"
                  onClick={onOpenCateringModal}
                  className="text-xs font-extrabold text-amber-800 hover:text-amber-900 flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
                >
                  <span>☕ İkram</span>
                </button>
              )}
              {onOpenAccessibilityModal && (
                <button
                  type="button"
                  onClick={onOpenAccessibilityModal}
                  className="text-xs font-extrabold text-blue-800 hover:text-blue-900 flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
                >
                  <span>♿ Engelsiz</span>
                </button>
              )}
              {onOpenStudentModal && (
                <button
                  type="button"
                  onClick={onOpenStudentModal}
                  className="text-xs font-extrabold text-purple-800 hover:text-purple-900 flex items-center gap-1.5 cursor-pointer bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition-colors"
                >
                  <span>🎓 Genç</span>
                </button>
              )}
              {onOpenTechModal && (
                <button
                  type="button"
                  onClick={onOpenTechModal}
                  className="text-xs font-extrabold text-cyan-800 hover:text-cyan-900 flex items-center gap-1.5 cursor-pointer bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-xl border border-cyan-200 transition-colors"
                >
                  <span>🔌 Priz & Wi-Fi</span>
                </button>
              )}
              {onOpenLostFoundModal && (
                <button
                  type="button"
                  onClick={onOpenLostFoundModal}
                  className="text-xs font-extrabold text-amber-900 hover:text-amber-950 flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 transition-colors"
                >
                  <span>📦 Kayıp Eşya</span>
                </button>
              )}
              {onOpenHighwayModal && (
                <button
                  type="button"
                  onClick={onOpenHighwayModal}
                  className="text-xs font-extrabold text-amber-800 hover:text-amber-900 flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
                >
                  <span>🛣️ Otoyol & Köprü</span>
                </button>
              )}
              {onOpenGroupModal && (
                <button
                  type="button"
                  onClick={onOpenGroupModal}
                  className="text-xs font-extrabold text-indigo-800 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors"
                >
                  <span>👥 Grup & Kurumsal</span>
                </button>
              )}
              {onOpenMedicalModal && (
                <button
                  type="button"
                  onClick={onOpenMedicalModal}
                  className="text-xs font-extrabold text-rose-800 hover:text-rose-900 flex items-center gap-1.5 cursor-pointer bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors"
                >
                  <span>🩺 Seyahat Sağlığı</span>
                </button>
              )}
              {onOpenRouteStopsModal && (
                <button
                  type="button"
                  onClick={onOpenRouteStopsModal}
                  className="text-xs font-extrabold text-amber-900 hover:text-amber-950 flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 transition-colors"
                >
                  <span>🗺️ Güzergah & Duraklar</span>
                </button>
              )}
              {onOpenRightsModal && (
                <button
                  type="button"
                  onClick={onOpenRightsModal}
                  className="text-xs font-extrabold text-emerald-900 hover:text-emerald-950 flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 transition-colors"
                >
                  <span>⚖️ Yolcu Hakları</span>
                </button>
              )}
              {onOpenGuidesModal && (
                <button
                  type="button"
                  onClick={onOpenGuidesModal}
                  className="text-xs font-extrabold text-amber-800 hover:text-amber-900 flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
                >
                  <span>🏖️ Tatil & Gezi Rehberi</span>
                </button>
              )}
              {onOpenRewardsModal && (
                <button
                  type="button"
                  onClick={onOpenRewardsModal}
                  className="text-xs font-extrabold text-amber-900 hover:text-amber-950 flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-400 transition-colors"
                >
                  <span>⭐ Sadakat & Miller</span>
                </button>
              )}
              {onOpenRadarModal && (
                <button
                  type="button"
                  onClick={onOpenRadarModal}
                  className="text-xs font-extrabold text-cyan-900 hover:text-cyan-950 flex items-center gap-1.5 cursor-pointer bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-xl border border-cyan-300 transition-colors"
                >
                  <span>🛰️ Yol & Radar Durumu</span>
                </button>
              )}
              {onOpenCampusModal && (
                <button
                  type="button"
                  onClick={onOpenCampusModal}
                  className="text-xs font-extrabold text-indigo-900 hover:text-indigo-950 flex items-center gap-1.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-300 transition-colors"
                >
                  <span>🎓 Kampüs & Yurt Ağı</span>
                </button>
              )}
              {onOpenCompareModal && (
                <button
                  type="button"
                  onClick={onOpenCompareModal}
                  className="text-xs font-extrabold text-bordeaux-900 hover:text-bordeaux-950 flex items-center gap-1.5 cursor-pointer bg-bordeaux-50 hover:bg-bordeaux-100 px-3 py-1.5 rounded-xl border border-bordeaux-300 transition-colors"
                >
                  <span>⚖️ Mod Karşılaştır</span>
                </button>
              )}
              {onOpenCityCardModal && (
                <button
                  type="button"
                  onClick={onOpenCityCardModal}
                  className="text-xs font-extrabold text-emerald-900 hover:text-emerald-950 flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 transition-colors"
                >
                  <span>💳 Şehir Kartları</span>
                </button>
              )}
              {onOpenOvernightModal && (
                <button
                  type="button"
                  onClick={onOpenOvernightModal}
                  className="text-xs font-extrabold text-indigo-950 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-300 transition-colors"
                >
                  <span>🌙 Gece Seferleri</span>
                </button>
              )}
              {onOpenSkiModal && (
                <button
                  type="button"
                  onClick={onOpenSkiModal}
                  className="text-xs font-extrabold text-cyan-950 hover:text-cyan-900 flex items-center gap-1.5 cursor-pointer bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-xl border border-cyan-300 transition-colors"
                >
                  <span>⛷️ Kayak & Kış</span>
                </button>
              )}
              {onOpenSeasonsModal && (
                <button
                  type="button"
                  onClick={onOpenSeasonsModal}
                  className="text-xs font-extrabold text-amber-950 hover:text-amber-900 flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 transition-colors"
                >
                  <span>📅 Sezon & Bayram</span>
                </button>
              )}
              {onOpenFlightRadarModal && (
                <button
                  type="button"
                  onClick={onOpenFlightRadarModal}
                  className="text-xs font-extrabold text-sky-950 hover:text-sky-900 flex items-center gap-1.5 cursor-pointer bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-300 transition-colors"
                >
                  <span>✈️ Uçuş Radarı</span>
                </button>
              )}
              {onOpenAirportMetroModal && (
                <button
                  type="button"
                  onClick={onOpenAirportMetroModal}
                  className="text-xs font-extrabold text-teal-950 hover:text-teal-900 flex items-center gap-1.5 cursor-pointer bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-300 transition-colors"
                >
                  <span>🚇 Havalimanı Metrosu</span>
                </button>
              )}
              {onOpenRouteNetworkModal && (
                <button
                  type="button"
                  onClick={onOpenRouteNetworkModal}
                  className="text-xs font-extrabold text-bordeaux-950 hover:text-bordeaux-900 flex items-center gap-1.5 cursor-pointer bg-rose-50/80 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-300 transition-colors"
                >
                  <span>🗺️ Rota Ağı</span>
                </button>
              )}
              {onOpenOccupancyModal && (
                <button
                  type="button"
                  onClick={onOpenOccupancyModal}
                  className="text-xs font-extrabold text-rose-950 hover:text-rose-900 flex items-center gap-1.5 cursor-pointer bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-300 transition-colors"
                >
                  <span>🔥 Doluluk Radarı</span>
                </button>
              )}
              {onOpenProvincesModal && (
                <button
                  type="button"
                  onClick={onOpenProvincesModal}
                  className="text-xs font-extrabold text-red-950 hover:text-red-900 flex items-center gap-1.5 cursor-pointer bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-300 transition-colors"
                >
                  <span>🇹🇷 81 İl Rehberi</span>
                </button>
              )}
              {onOpenTransfersModal && (
                <button
                  type="button"
                  onClick={onOpenTransfersModal}
                  className="text-xs font-extrabold text-amber-950 hover:text-amber-900 flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 transition-colors"
                >
                  <span>🔄 Akıllı Aktarma</span>
                </button>
              )}
              {onOpenSeatComfortModal && (
                <button
                  type="button"
                  onClick={onOpenSeatComfortModal}
                  className="text-xs font-extrabold text-amber-950 hover:text-amber-900 flex items-center gap-1.5 cursor-pointer bg-amber-50/90 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 transition-colors"
                >
                  <span>💺 Koltuk & Gölge</span>
                </button>
              )}
              {onOpenRescheduleModal && (
                <button
                  type="button"
                  onClick={onOpenRescheduleModal}
                  className="text-xs font-extrabold text-emerald-950 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 transition-colors"
                >
                  <span>📅 Bilet Erteleme</span>
                </button>
              )}
              {onOpenEntertainmentModal && (
                <button
                  type="button"
                  onClick={onOpenEntertainmentModal}
                  className="text-xs font-extrabold text-indigo-950 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-300 transition-colors"
                >
                  <span>🎬 Eğlence & TV</span>
                </button>
              )}
              {onOpenParcelModal && (
                <button
                  type="button"
                  onClick={onOpenParcelModal}
                  className="text-xs font-extrabold text-amber-950 hover:text-amber-900 flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 transition-colors"
                >
                  <span>📦 Hızlı Kargo</span>
                </button>
              )}
              {onOpenSleeperTrainModal && (
                <button
                  type="button"
                  onClick={onOpenSleeperTrainModal}
                  className="text-xs font-extrabold text-emerald-950 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 transition-colors"
                >
                  <span>🚂 Yataklı Trenler</span>
                </button>
              )}
            </div>
          </div>

          {/* Col 2: Ulaşım Türleri */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
              Ulaşım Türleri
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">Otobüs Bileti</a></li>
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">Uçak Bileti</a></li>
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">Hızlı Tren Bileti</a></li>
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">Feribot & Deniz Otobüsü</a></li>
              {onOpenTerminalGuide && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenTerminalGuide}
                    className="hover:text-bordeaux-700 transition-colors cursor-pointer text-left"
                  >
                    Terminal & Gar Rehberi
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Popüler Güzergahlar */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
              Popüler Rotalar
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">İstanbul - Ankara Otobüs</a></li>
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">İstanbul - İzmir Seferleri</a></li>
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">Ankara - Konya YHT</a></li>
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">İstanbul - Antalya Uçak</a></li>
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">Yenikapı - Bursa Feribot</a></li>
            </ul>
          </div>

          {/* Col 4: Kurumsal & Güvenlik */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
              Sefer Hakkında
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">Hakkımızda</a></li>
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">Ücretsiz İade Garantisi</a></li>
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">Gizlilik & KVKK Politikası</a></li>
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">Kullanıcı Sözleşmesi</a></li>
              <li><a href="#" className="hover:text-bordeaux-700 transition-colors">İletişim & 7/24 Destek</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            © 2026 Sefer Biletleme ve Teknoloji A.Ş. Tüm hakları saklıdır.
          </div>
          <div className="flex items-center gap-1 text-charcoal-muted">
            <span>Yolculuk tutkusu ile tasarlandı</span>
            <BileoHeart className="w-3.5 h-3.5 text-bordeaux-700 fill-bordeaux-700" />
          </div>
        </div>

      </div>
    </footer>
  );
};
