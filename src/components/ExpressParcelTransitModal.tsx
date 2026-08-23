import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoSearch,
  BileoClock,
  BileoBus,
} from './icons';
import { sound } from '../utils/sound';

interface ExpressParcelTransitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface ParcelTrackingResult {
  trackingNo: string;
  sender: string;
  receiver: string;
  originTerminal: string;
  destTerminal: string;
  carrier: string;
  vehiclePlate: string;
  status: 'departed' | 'in_transit' | 'ready_for_pickup' | 'delivered';
  statusText: string;
  departureTime: string;
  estArrivalTime: string;
  itemType: string;
  weightKg: number;
}

const SAMPLE_TRACKING_DATA: Record<string, ParcelTrackingResult> = {
  'KRG-784102': {
    trackingNo: 'KRG-784102',
    sender: 'Mehmet K. (İstanbul)',
    receiver: 'Ayşe B. (Ankara)',
    originTerminal: 'İstanbul Esenler 15 Temmuz Demokrasi Otogarı',
    destTerminal: 'Ankara AŞTİ Otobüs Terminali Kargo Şubesi',
    carrier: 'Pamukkale Ekspres Kargo',
    vehiclePlate: '34 PK 942',
    status: 'in_transit',
    statusText: 'Bolu Tüneli Mevkiinde (Yolda)',
    departureTime: '11:00',
    estArrivalTime: '16:30',
    itemType: 'Orta Boy Koli (Yöresel Gıda)',
    weightKg: 8.5,
  },
  'KRG-319482': {
    trackingNo: 'KRG-319482',
    sender: 'Zeynep D. (İzmir)',
    receiver: 'Caner T. (Bursa)',
    originTerminal: 'İzmir İZOTAŞ Şehirlerarası Otobüs Terminali',
    destTerminal: 'Bursa Şehirlerarası Otobüs Terminali Kargo Bürosu',
    carrier: 'Kamil Koç Kargo & Kurye',
    vehiclePlate: '35 KK 118',
    status: 'ready_for_pickup',
    statusText: 'Bursa Otogarı Kargo Bürosunda Teslime Hazır',
    departureTime: '08:30',
    estArrivalTime: '12:45',
    itemType: 'Acil Resmi Evrak & Dosya',
    weightKg: 0.4,
  },
};

const CARGO_PRICE_TIERS = [
  {
    type: 'Zarf & Resmi Evrak',
    icon: '✉️',
    maxWeight: '0 - 1 kg',
    estDelivery: '4 - 8 Saat (Aynı Gün)',
    price: '90 - 130 ₺',
    popularUse: 'Sözleşme, pasaport, tapu evrakları',
  },
  {
    type: 'Küçük Koli (Kutu)',
    icon: '📦',
    maxWeight: '1 - 5 kg (1-10 Desi)',
    estDelivery: 'Aynı Gün Otobüsle',
    price: '140 - 200 ₺',
    popularUse: 'Kıyafet, küçük cihaz, numune',
  },
  {
    type: 'Orta & Büyük Koli',
    icon: '🛅',
    maxWeight: '5 - 15 kg (10-30 Desi)',
    estDelivery: 'Aynı Gün Otobüsle',
    price: '220 - 320 ₺',
    popularUse: 'Yöresel gıda, zeytinyağı tenekesi, çeyiz',
  },
  {
    type: 'THY Jet Kargo (Havalimanı)',
    icon: '✈️',
    maxWeight: '0 - 30 kg',
    estDelivery: '2 - 4 Saat (Uçuş Süresi)',
    price: '350 - 650 ₺',
    popularUse: 'Acil yedek parça, soğuk zincir ilaç/gıda',
  },
];

const TERMINAL_CARGO_OFFICES = [
  { name: 'İstanbul Esenler Otogarı Kargo İskelesi', phone: '0212 658 20 00', hours: '7/24 Açık' },
  { name: 'Ankara AŞTİ Kargo ve Emanet Şubesi', phone: '0312 207 10 00', hours: '7/24 Açık' },
  { name: 'İzmir İZOTAŞ Kargo Sevk Terminali', phone: '0232 472 10 10', hours: '06:00 - 02:00' },
  { name: 'Antalya Şehirlerarası Otogar Kargo Alanı', phone: '0242 331 12 50', hours: '07:00 - 00:00' },
];

export const ExpressParcelTransitModal: React.FC<ExpressParcelTransitModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('KRG-784102');
  const [activeParcel, setActiveParcel] = useState<ParcelTrackingResult | null>(SAMPLE_TRACKING_DATA['KRG-784102']);
  const [activeTab, setActiveTab] = useState<'track' | 'rates' | 'offices'>('track');

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = searchQuery.trim().toUpperCase();
    if (SAMPLE_TRACKING_DATA[cleanQuery]) {
      sound.playSuccess();
      setActiveParcel(SAMPLE_TRACKING_DATA[cleanQuery]);
      if (onShowToast) {
        onShowToast('Kargo Bulundu', `${cleanQuery} nolu gönderinin canlı konumu görüntülendi.`, 'success');
      }
    } else {
      sound.playTick();
      // Generate dynamic tracking result for demo
      const simulated: ParcelTrackingResult = {
        trackingNo: cleanQuery,
        sender: 'Ahmet Y. (İstanbul)',
        receiver: 'Zeki K. (İzmir)',
        originTerminal: 'İstanbul Alibeyköy Cep Otogarı',
        destTerminal: 'İzmir İZOTAŞ Kargo Bürosu',
        carrier: 'Bileo Ekspres Şehirlerarası Sevk',
        vehiclePlate: '34 BL 104',
        status: 'in_transit',
        statusText: 'O-5 Otoyolu Susurluk Mevkiinde (Yolda)',
        departureTime: '13:00',
        estArrivalTime: '18:15',
        itemType: 'Standart Paket (Koli)',
        weightKg: 4.2,
      };
      setActiveParcel(simulated);
      if (onShowToast) {
        onShowToast('Gönderi Sorgulandı', `${cleanQuery} nolu kargo otobüs bagajında aktif sevkiyatta.`, 'info');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center border border-amber-200 text-lg font-black">
              📦
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Otogar & Uçak Hızlı Kargo Portalı</h3>
              <p className="text-xs text-charcoal-muted font-medium">Şehirlerarası aynı gün otobüs bagajı ve uçak kargo takip & tarife rehberi</p>
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
          
          {/* Sub Navigation */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('track'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'track'
                  ? 'bg-bordeaux-900 text-white border-bordeaux-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              🔍 Canlı Kargo Takibi
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('rates'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'rates'
                  ? 'bg-bordeaux-900 text-white border-bordeaux-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              🏷️ Fiyat & Desi Tarifeleri
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); setActiveTab('offices'); }}
              className={`py-3 px-4 rounded-2xl text-center font-black text-xs transition-all cursor-pointer border shadow-2xs ${
                activeTab === 'offices'
                  ? 'bg-bordeaux-900 text-white border-bordeaux-900'
                  : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
              }`}
            >
              🏢 Otogar Kargo Büroları
            </button>
          </div>

          {activeTab === 'track' && (
            <div className="space-y-5">
              
              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Kargo Takip No (Ör: KRG-784102, KRG-319482)"
                    className="w-full bg-white border border-[#E8E1D5] rounded-2xl px-4 py-3.5 text-xs font-bold text-charcoal placeholder-charcoal-muted focus:outline-none focus:border-bordeaux-900 uppercase font-mono shadow-2xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-2xl bg-bordeaux-900 hover:bg-bordeaux-950 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-soft"
                >
                  <BileoSearch className="w-4 h-4" />
                  <span>Sorgula</span>
                </button>
              </form>

              {/* Active Parcel Tracking Card */}
              {activeParcel && (
                <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E1D5]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-bordeaux-50 border border-bordeaux-200 flex items-center justify-center">
                        <BileoBus className="w-4 h-4 text-bordeaux-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-charcoal">{activeParcel.carrier}</span>
                          <span className="text-[10px] font-bold text-charcoal-muted bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#E8E1D5] font-mono">
                            {activeParcel.vehiclePlate}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-charcoal mt-0.5">
                          Takip No: <span className="font-mono text-bordeaux-900">{activeParcel.trackingNo}</span>
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-black px-3 py-1 rounded-xl border inline-block ${
                        activeParcel.status === 'ready_for_pickup'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300'
                      }`}>
                        {activeParcel.statusText}
                      </span>
                    </div>
                  </div>

                  {/* Route & Times */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                    <div>
                      <span className="text-[10px] font-extrabold text-charcoal-muted uppercase block">Çıkış Otogarı</span>
                      <strong className="text-xs font-black text-charcoal block mt-0.5">{activeParcel.originTerminal}</strong>
                      <span className="text-[11px] text-charcoal-muted font-medium mt-1 block">Kalkış: {activeParcel.departureTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-charcoal-muted uppercase block">Varış Otogarı / Şube</span>
                      <strong className="text-xs font-black text-charcoal block mt-0.5">{activeParcel.destTerminal}</strong>
                      <span className="text-[11px] text-charcoal-muted font-medium mt-1 block">Tahmini Varış: <strong className="text-bordeaux-900">{activeParcel.estArrivalTime}</strong></span>
                    </div>
                  </div>

                  {/* Sender, Receiver & Package specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-charcoal-muted font-bold block">Gönderici</span>
                      <span className="font-black text-charcoal mt-0.5 block">{activeParcel.sender}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-charcoal-muted font-bold block">Alıcı</span>
                      <span className="font-black text-charcoal mt-0.5 block">{activeParcel.receiver}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-charcoal-muted font-bold block">İçerik Tipi</span>
                      <span className="font-black text-charcoal mt-0.5 block">{activeParcel.itemType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-charcoal-muted font-bold block">Ağırlık</span>
                      <span className="font-black text-charcoal mt-0.5 block">{activeParcel.weightKg} kg</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center gap-2 text-[11px] text-amber-950 font-medium">
                    <BileoClock className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>Alıcı, varış otogarındaki emanet kargo bürosundan kimlik ibrazı ve SMS kodu ile paketini teslim alabilir.</span>
                  </div>
                </div>
              )}

            </div>
          )}

          {activeTab === 'rates' && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-charcoal uppercase tracking-wider">Şehirlerarası Otobüs & Uçak Kargo Tarifeleri</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CARGO_PRICE_TIERS.map((tier, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-2 shadow-2xs hover:border-bordeaux-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tier.icon}</span>
                        <h5 className="font-black text-charcoal text-xs">{tier.type}</h5>
                      </div>
                      <span className="text-xs font-black text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {tier.price}
                      </span>
                    </div>

                    <div className="text-[11px] text-charcoal-muted space-y-1">
                      <div className="flex justify-between">
                        <span>Ağırlık / Desi:</span>
                        <strong className="text-charcoal">{tier.maxWeight}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Teslim Süresi:</span>
                        <strong className="text-charcoal">{tier.estDelivery}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Örnek Kullanım:</span>
                        <span className="text-charcoal font-medium">{tier.popularUse}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'offices' && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-charcoal uppercase tracking-wider">Büyük Şehir Otogar Kargo İskeleleri</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TERMINAL_CARGO_OFFICES.map((office, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-[#E8E1D5] space-y-1.5 shadow-2xs"
                  >
                    <h5 className="text-xs font-black text-charcoal">{office.name}</h5>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-charcoal-muted font-bold font-mono">{office.phone}</span>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {office.hours}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-charcoal-muted font-medium">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Yalnızca resmi otogar emanet şubelerine kayıtlı paketler sigortalanır.</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal font-black text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
