import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoCheckCircle,
  BileoBus,
  BileoPlane,
  BileoTrain,
  BileoFerry,
} from './icons';
import { sound } from '../utils/sound';

interface EcoTreeOffsetCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface CarbonRouteInfo {
  id: string;
  routeName: string;
  distanceKm: number;
  busEmissionKg: number;
  flightEmissionKg: number;
  trainEmissionKg: number;
  ferryEmissionKg: number;
}

const POPULAR_CARBON_ROUTES: CarbonRouteInfo[] = [
  {
    id: 'ist-ank',
    routeName: 'İstanbul ↔ Ankara (450 km)',
    distanceKm: 450,
    busEmissionKg: 18,
    flightEmissionKg: 78,
    trainEmissionKg: 6,
    ferryEmissionKg: 0,
  },
  {
    id: 'ist-izm',
    routeName: 'İstanbul ↔ İzmir (480 km)',
    distanceKm: 480,
    busEmissionKg: 20,
    flightEmissionKg: 82,
    trainEmissionKg: 8,
    ferryEmissionKg: 14,
  },
  {
    id: 'ank-ant',
    routeName: 'Ankara ↔ Antalya (490 km)',
    distanceKm: 490,
    busEmissionKg: 21,
    flightEmissionKg: 85,
    trainEmissionKg: 9,
    ferryEmissionKg: 0,
  },
  {
    id: 'ist-trb',
    routeName: 'İstanbul ↔ Trabzon (1,060 km)',
    distanceKm: 1060,
    busEmissionKg: 44,
    flightEmissionKg: 165,
    trainEmissionKg: 19,
    ferryEmissionKg: 0,
  },
];

export const EcoTreeOffsetCertificateModal: React.FC<EcoTreeOffsetCertificateModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ist-ank');
  const [selectedTransport, setSelectedTransport] = useState<'otobus' | 'tren' | 'ucak' | 'feribot'>('tren');
  const [passengerName, setPassengerName] = useState<string>('Yusuf Caymaz');
  const [plantedForest, setPlantedForest] = useState<string>('Çanakkale Zafer Hatıra Ormanı');
  const [certificateId] = useState<string>(() => `BIL-ECO-${Math.floor(100000 + Math.random() * 900000)}`);

  if (!isOpen) return null;

  const currentRoute = POPULAR_CARBON_ROUTES.find((r) => r.id === selectedRouteId) || POPULAR_CARBON_ROUTES[0];

  let currentEmission = currentRoute.busEmissionKg;
  if (selectedTransport === 'tren') currentEmission = currentRoute.trainEmissionKg;
  if (selectedTransport === 'ucak') currentEmission = currentRoute.flightEmissionKg;
  if (selectedTransport === 'feribot') currentEmission = currentRoute.ferryEmissionKg || currentRoute.busEmissionKg;

  // Saved carbon compared to flight
  const savedCarbon = Math.max(0, currentRoute.flightEmissionKg - currentEmission);
  const treeOffsetCount = Math.max(1, Math.ceil(currentRoute.distanceKm / 800));

  const handleCopyCertificate = () => {
    sound.playSuccess();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Bileo Yeşil Yolcu Fidan Sertifikası\nSahibi: ${passengerName}\nSertifika No: ${certificateId}\nGüzergah: ${currentRoute.routeName}\nÖnlenen Karbon: ${savedCarbon} kg CO₂\nDikim Alanı: ${plantedForest}\nDoğrula: https://bileo.vercel.app`
      );
    }
    if (onShowToast) {
      onShowToast(
        'Sertifika Kopyalandı',
        'Yeşil Yolcu Fidan Sertifikası panoya kopyalandı.',
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <BileoShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Karbon Dengeleme & Yeşil Fidan Sertifikası</h3>
              <p className="text-xs text-charcoal-muted font-medium">Seyahat ayak izinizi sıfırlayın ve adınıza TEMA/OGM fidanı tescilleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Top Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Route Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-charcoal uppercase tracking-wider block">
                Seyahat Güzergahı
              </label>
              <select
                value={selectedRouteId}
                onChange={(e) => { sound.playTick(); setSelectedRouteId(e.target.value); }}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E1D5] text-xs font-bold text-charcoal outline-none cursor-pointer"
              >
                {POPULAR_CARBON_ROUTES.map((r) => (
                  <option key={r.id} value={r.id}>{r.routeName}</option>
                ))}
              </select>
            </div>

            {/* Transport Modality Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-charcoal uppercase tracking-wider block">
                Ulaşım Modu
              </label>
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => { sound.playTick(); setSelectedTransport('tren'); }}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center border transition-all cursor-pointer ${
                    selectedTransport === 'tren'
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                  }`}
                  title="Yüksek Hızlı Tren"
                >
                  <BileoTrain className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { sound.playTick(); setSelectedTransport('otobus'); }}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center border transition-all cursor-pointer ${
                    selectedTransport === 'otobus'
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                  }`}
                  title="Otobüs"
                >
                  <BileoBus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { sound.playTick(); setSelectedTransport('ucak'); }}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center border transition-all cursor-pointer ${
                    selectedTransport === 'ucak'
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                  }`}
                  title="Uçak"
                >
                  <BileoPlane className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { sound.playTick(); setSelectedTransport('feribot'); }}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center border transition-all cursor-pointer ${
                    selectedTransport === 'feribot'
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                  }`}
                  title="Feribot"
                >
                  <BileoFerry className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Passenger Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-charcoal uppercase tracking-wider block">
                Sertifika Sahibi
              </label>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                placeholder="Ad Soyad"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E1D5] text-xs font-bold text-charcoal outline-none"
              />
            </div>

          </div>

          {/* Environmental Carbon Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider block">
                Sefer Karbon Salınımı
              </span>
              <div className="text-xl font-black text-charcoal font-mono">
                {currentEmission} <span className="text-xs font-medium text-charcoal-muted">kg CO₂ / kişi</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Uçağa Göre Önlenen Salınım
              </span>
              <div className="text-xl font-black text-emerald-900 font-mono">
                +{savedCarbon} <span className="text-xs font-medium text-emerald-700">kg CO₂ Tasarruf</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Nötrleme Fidan Eşleşmesi
              </span>
              <div className="text-xl font-black text-amber-950 font-mono">
                {treeOffsetCount} Adet <span className="text-xs font-medium text-amber-800">Fidan Dikimi</span>
              </div>
            </div>
          </div>

          {/* Certificate Preview Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-900 to-[#0A2E1F] text-white shadow-xl border-2 border-emerald-600/30 relative overflow-hidden space-y-5">
            <div className="flex items-center justify-between border-b border-emerald-700/50 pb-4">
              <div>
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block">
                  TÜRKİYE YEŞİL SEYAHAT PROTOKOLÜ
                </span>
                <h4 className="text-lg font-black text-white font-display">Resmi Dijital Fidan Bağış Sertifikası</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-emerald-300 block">Sertifika ID</span>
                <span className="text-xs font-mono font-bold text-white">{certificateId}</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                Bu sertifika, <strong className="text-white font-black underline">{passengerName || 'Değerli Yolcumuz'}</strong> adına,{' '}
                <strong>{currentRoute.routeName}</strong> güzergahında gerçekleştirilen seyahatin karbon salınımını sıfırlamak üzere{' '}
                <strong className="text-emerald-300">{plantedForest}</strong> sahasına {treeOffsetCount} adet fidan tahsis edildiğini belgeler.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-emerald-200 font-mono">
                <div className="flex items-center gap-1.5">
                  <BileoCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sıfır Karbon Yolculuk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BileoCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>OGM / TEMA Parsel Kaydı</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BileoCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>E-Devlet Tescil Uyumlu</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-emerald-700/50">
              <div className="flex items-center gap-2 text-xs">
                <label className="text-[11px] text-emerald-300">Ağaçlandırma Sahası:</label>
                <select
                  value={plantedForest}
                  onChange={(e) => setPlantedForest(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-xs font-bold text-white outline-none cursor-pointer"
                >
                  <option value="Çanakkale Zafer Hatıra Ormanı" className="text-charcoal">Çanakkale Zafer Hatıra Ormanı</option>
                  <option value="Toroslar Doğa Koruma Sahası" className="text-charcoal">Toroslar Doğa Koruma Sahası</option>
                  <option value="Eskişehir Gençlik Ormanı" className="text-charcoal">Eskişehir Gençlik Ormanı</option>
                  <option value="Karadeniz Yeşillendirme Alanı" className="text-charcoal">Karadeniz Yeşillendirme Alanı</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleCopyCertificate}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <BileoShieldCheck className="w-3.5 h-3.5" />
                <span>Sertifikayı Kopyala / Paylaş</span>
              </button>
            </div>
          </div>

          {/* Footer Close */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal font-black text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
