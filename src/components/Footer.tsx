import React from 'react';
import { BileoShieldCheck, BileoHeart } from './icons';
import { SeferLogo } from './SeferLogo';

interface FooterProps {
  onOpenEcoModal?: () => void;
  onOpenTerminalGuide?: () => void;
  onOpenCurrencyModal?: () => void;
  onOpenLuggageModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenEcoModal,
  onOpenTerminalGuide,
  onOpenCurrencyModal,
  onOpenLuggageModal,
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
                  <span>💱 Döviz Çevirici</span>
                </button>
              )}
              {onOpenLuggageModal && (
                <button
                  type="button"
                  onClick={onOpenLuggageModal}
                  className="text-xs font-extrabold text-blue-800 hover:text-blue-900 flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
                >
                  <span>🧳 Bagaj Rehberi</span>
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
