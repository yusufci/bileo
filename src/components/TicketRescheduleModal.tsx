import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoCalendar,
  BileoClock,
  BileoRotateCcw,
  BileoArrowRight,
  BileoCheckCircle,
  BileoBus,
  BileoTrain,
  BileoPlane,
} from './icons';
import { sound } from '../utils/sound';
import { BookingTicket, TransportType } from '../types';

interface TicketRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets?: BookingTicket[];
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface AlternativeTrip {
  id: string;
  time: string;
  carrier: string;
  vehicleType: string;
  seatsLeft: number;
  priceDelta: number;
}

export const TicketRescheduleModal: React.FC<TicketRescheduleModalProps> = ({
  isOpen,
  onClose,
  tickets = [],
  onShowToast,
}) => {
  // Use first ticket or authentic default fallback
  const activeTicket: BookingTicket = tickets.length > 0 ? tickets[0] : {
    pnr: 'BL-984210',
    route: {
      id: 'mock-1',
      from: 'İstanbul',
      fromTerminal: 'Alibeyköy Cep Otogarı',
      to: 'Ankara',
      toTerminal: 'AŞTİ Şehirlerarası Otobüs Terminali',
      departureTime: '14:30',
      arrivalTime: '19:00',
      duration: '4s 30d',
      date: '24 Mayıs 2026',
      price: 450,
      transportType: 'otobus',
      company: 'Pamukkale Turizm',
      vehicleType: '2+1 Pamukyol Travego',
      availableSeats: 8,
      rating: 4.8,
      reviewCount: 342,
      features: ['Wi-Fi', '220V Priz', 'İkram'],
    },
    passengers: [
      {
        id: 'p-1',
        seatNumber: 14,
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        idNumber: '12345678901',
        gender: 'male',
        email: 'ahmet@example.com',
        phone: '0555 123 4567',
      },
    ],
    seats: [14],
    totalPrice: 450,
    status: 'active',
    purchaseDate: '2026-05-20',
    qrCodeValue: 'BILEO-PNR-BL984210',
  };

  const [selectedAction, setSelectedAction] = useState<'earlier' | 'later' | 'open_voucher'>('earlier');
  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string>('alt-1');

  const alternativeTrips: AlternativeTrip[] = [
    {
      id: 'alt-1',
      time: '12:00 (2.5 Saat Önce)',
      carrier: activeTicket.route.company,
      vehicleType: '2+1 Travego SHD',
      seatsLeft: 5,
      priceDelta: 0,
    },
    {
      id: 'alt-2',
      time: '13:15 (1 Saat 15 Dk Önce)',
      carrier: activeTicket.route.company,
      vehicleType: '2+1 Jumbo Lounge',
      seatsLeft: 3,
      priceDelta: 0,
    },
    {
      id: 'alt-3',
      time: '16:00 (1.5 Saat Sonra)',
      carrier: activeTicket.route.company,
      vehicleType: '2+1 Pamukyol Travego',
      seatsLeft: 12,
      priceDelta: 0,
    },
    {
      id: 'alt-4',
      time: '18:30 (Akşam Seferi)',
      carrier: activeTicket.route.company,
      vehicleType: '2+1 Pamukyol Travego',
      seatsLeft: 7,
      priceDelta: 0,
    },
  ];

  if (!isOpen) return null;

  const handleConfirmReschedule = () => {
    sound.playSuccess();
    if (onShowToast) {
      if (selectedAction === 'open_voucher') {
        onShowToast(
          'Bilet Açığa Alındı',
          `${activeTicket.pnr} PNR nolu biletiniz 1 yıl geçerli açık kupona dönüştürüldü.`,
          'success'
        );
      } else {
        const chosen = alternativeTrips.find((a) => a.id === selectedAlternativeId);
        onShowToast(
          'Sefer Saati Güncellendi',
          `Biletiniz yeni ${chosen?.time.split(' ')[0] || 'seçilen'} saatine başarıyla aktarıldı. SMS gönderildi.`,
          'success'
        );
      }
    }
    onClose();
  };

  const getModeIcon = (mode: TransportType) => {
    switch (mode) {
      case 'tren': return <BileoTrain className="w-4 h-4 text-emerald-700" />;
      case 'ucak': return <BileoPlane className="w-4 h-4 text-sky-700" />;
      default: return <BileoBus className="w-4 h-4 text-bordeaux-700" />;
    }
  };

  const primaryPassenger = activeTicket.passengers[0];
  const seatDisplay = typeof activeTicket.seats[0] === 'object' && activeTicket.seats[0] !== null
    ? (activeTicket.seats[0] as { number?: string | number; seatNumber?: string }).number || (activeTicket.seats[0] as { number?: string | number; seatNumber?: string }).seatNumber
    : activeTicket.seats[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center border border-amber-200 text-lg font-black">
              🔄
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Akıllı Bilet Erteleme & Saat Değişikliği</h3>
              <p className="text-xs text-charcoal-muted font-medium">Kalkış saatini erkene çekin, erteleyin veya cezasız açık bilete dönüştürün</p>
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
          
          {/* Current Ticket Summary Banner */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E1D5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-bordeaux-50 border border-bordeaux-200 flex items-center justify-center">
                  {getModeIcon(activeTicket.route.transportType)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-charcoal">{activeTicket.route.company}</span>
                    <span className="text-[10px] font-bold text-bordeaux-800 bg-bordeaux-50 px-2 py-0.5 rounded-md border border-bordeaux-200">
                      PNR: {activeTicket.pnr}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-charcoal mt-0.5">
                    {activeTicket.route.from} ➔ {activeTicket.route.to}
                  </h4>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-charcoal-muted font-bold block">Mevcut Sefer Vakti</span>
                <span className="text-sm font-black text-bordeaux-900">
                  {activeTicket.route.date} • {activeTicket.route.departureTime}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-charcoal-muted gap-2">
              <span>Terminal: <strong className="text-charcoal">{activeTicket.route.fromTerminal}</strong></span>
              <span>Koltuk: <strong className="text-charcoal">{seatDisplay}</strong></span>
              <span>Yolcu: <strong className="text-charcoal">{primaryPassenger?.firstName} {primaryPassenger?.lastName}</strong></span>
              <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                <BileoShieldCheck className="w-3.5 h-3.5" />
                Ücretsiz Değişiklik Hakkı Aktif
              </span>
            </div>
          </div>

          {/* Action Selector: Earlier / Later / Open Ticket */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => { sound.playTick(); setSelectedAction('earlier'); }}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer shadow-2xs space-y-1.5 ${
                selectedAction === 'earlier'
                  ? 'border-bordeaux-900 bg-bordeaux-50/40 ring-2 ring-bordeaux-900/10'
                  : 'bg-white border-[#E8E1D5] hover:border-bordeaux-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-charcoal">⚡ Daha Erken Sefere Geç</span>
                <BileoClock className="w-4 h-4 text-amber-700" />
              </div>
              <p className="text-[11px] text-charcoal-muted font-medium">
                İşiniz erken bittiyse terminaldeki bir önceki kalkışa hemen geçin.
              </p>
            </button>

            <button
              type="button"
              onClick={() => { sound.playTick(); setSelectedAction('later'); }}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer shadow-2xs space-y-1.5 ${
                selectedAction === 'later'
                  ? 'border-bordeaux-900 bg-bordeaux-50/40 ring-2 ring-bordeaux-900/10'
                  : 'bg-white border-[#E8E1D5] hover:border-bordeaux-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-charcoal">🕒 Daha İleri Bir Saate Ertele</span>
                <BileoCalendar className="w-4 h-4 text-indigo-700" />
              </div>
              <p className="text-[11px] text-charcoal-muted font-medium">
                Gecikme durumunda aynı günün akşamına veya ertesi güne kaydırın.
              </p>
            </button>

            <button
              type="button"
              onClick={() => { sound.playTick(); setSelectedAction('open_voucher'); }}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer shadow-2xs space-y-1.5 ${
                selectedAction === 'open_voucher'
                  ? 'border-bordeaux-900 bg-bordeaux-50/40 ring-2 ring-bordeaux-900/10'
                  : 'bg-white border-[#E8E1D5] hover:border-bordeaux-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-charcoal">🎫 Açık Bilete Dönüştür</span>
                <BileoRotateCcw className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-[11px] text-charcoal-muted font-medium">
                1 yıl boyunca Türkiye genelinde tüm hatlarda kullanabileceğiniz kupon.
              </p>
            </button>
          </div>

          {/* Alternative Trips Selection for Time Change */}
          {selectedAction !== 'open_voucher' ? (
            <div className="space-y-3">
              <h5 className="text-xs font-black text-charcoal uppercase tracking-wider">
                {selectedAction === 'earlier' ? 'Kullanılabilir Erken Kalkışlar' : 'Kullanılabilir İleri Saatli Seferler'}
              </h5>

              <div className="space-y-2.5">
                {alternativeTrips.map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => { sound.playTick(); setSelectedAlternativeId(alt.id); }}
                    className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
                      selectedAlternativeId === alt.id
                        ? 'border-bordeaux-900 bg-bordeaux-50/30 ring-2 ring-bordeaux-900/10'
                        : 'border-[#E8E1D5] hover:border-bordeaux-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAlternativeId === alt.id ? 'border-bordeaux-900 bg-bordeaux-900 text-white' : 'border-charcoal-muted/40'
                      }`}>
                        {selectedAlternativeId === alt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-black text-charcoal">{alt.time}</strong>
                          <span className="text-[10px] font-bold text-charcoal-muted bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#E8E1D5]">
                            {alt.vehicleType}
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                          Son {alt.seatsLeft} Koltuk Müsait
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {alt.priceDelta === 0 ? '0 ₺ Fark (Ücretsiz)' : `+${alt.priceDelta} ₺ Fark`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                <BileoCheckCircle className="w-5 h-5 text-emerald-700" />
                <span>Bileo 365 Gün Açık Bilet Garantisi</span>
              </div>
              <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                Biletinizi açığa aldığınızda <strong>{activeTicket.totalPrice} ₺</strong> tutarındaki bakiyeniz Bileo Cüzdanınıza tanımlanır. İstediğiniz tarihte, istediğiniz firma veya seferde kesintisiz kullanabilirsiniz.
              </p>
              <ul className="text-xs text-emerald-900/80 font-bold space-y-1">
                <li>• Sıfır işlem ücreti</li>
                <li>• 12 ay kesintisiz kullanım süresi</li>
                <li>• Otobüs, uçak, YHT ve feribot dahil tüm modlarda geçerli</li>
              </ul>
            </div>
          )}

          {/* Action Footer */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-charcoal-muted font-medium">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Değişiklik anında SMS & E-posta ile yeni bilet PDF'iniz iletilir.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal font-black text-xs transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                className="px-5 py-2.5 rounded-xl bg-bordeaux-900 hover:bg-bordeaux-950 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-soft"
              >
                <span>{selectedAction === 'open_voucher' ? 'Açık Bilete Dönüştür' : 'Sefer Değişikliğini Onayla'}</span>
                <BileoArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
