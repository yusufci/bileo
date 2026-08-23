import React, { useState, useEffect } from 'react';
import {
  BileoArrowLeft,
  BileoSearch,
  BileoPrinter,
  BileoRotateCcw,
  BileoCopy,
  BileoCheck,
  BileoArrowRight,
  BileoTicket
} from './icons';
import { BookingTicket } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { SeferLogo } from './SeferLogo';

interface TicketWalletModalProps {
  tickets: BookingTicket[];
  onClose: () => void;
  onOpenRefund: (ticket: BookingTicket) => void;
  onCancelTicket?: (pnr: string) => void;
}

export const TicketWalletModal: React.FC<TicketWalletModalProps> = ({
  tickets,
  onClose,
  onOpenRefund,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'active' | 'refunded'>('all');
  const [copiedPnr, setCopiedPnr] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const [selectedTicketPnr, setSelectedTicketPnr] = useState<string>(
    tickets.length > 0 ? tickets[0].pnr : ''
  );

  const filteredTickets = tickets.filter((t) => {
    const isCancelled = t.status === 'cancelled' || t.status === 'refunded';
    if (activeTabFilter === 'active' && isCancelled) return false;
    if (activeTabFilter === 'refunded' && !isCancelled) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchPnr = t.pnr.toLowerCase().includes(q);
    const matchFrom = t.route.from.toLowerCase().includes(q);
    const matchTo = t.route.to.toLowerCase().includes(q);
    const matchCompany = t.route.company.toLowerCase().includes(q);
    const matchPassenger = t.passengers.some(
      (p) => p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q)
    );

    return matchPnr || matchFrom || matchTo || matchCompany || matchPassenger;
  });

  const selectedTicket = tickets.find((t) => t.pnr === selectedTicketPnr) || (filteredTickets.length > 0 ? filteredTickets[0] : null);

  const handleCopy = (pnr: string) => {
    navigator.clipboard.writeText(pnr);
    setCopiedPnr(pnr);
    setTimeout(() => setCopiedPnr(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-charcoal flex flex-col selection:bg-bordeaux-700 selection:text-white">
      
      {/* Top Main Navigation Bar (Consistent with Bileo Brand Header) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo & Breadcrumb Navigation */}
          <div className="flex items-center gap-6">
            <button
              onClick={onClose}
              className="cursor-pointer"
              title="Ana Sayfaya Dön"
            >
              <SeferLogo size="md" variant="bordeaux" />
            </button>

            <div className="h-6 w-[1px] bg-[#E8E1D5] hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-charcoal-muted">
              <span className="text-charcoal font-black">Cüzdanım</span>
              <span>/</span>
              <span>Kayıtlı Biniş Kartları</span>
            </div>
          </div>

          {/* Right Action: Back */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-[#1E1B18] hover:text-bordeaux-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <BileoArrowLeft className="w-4 h-4 text-bordeaux-700" />
              <span>Ana Sayfaya Dön</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Grounded Page Title Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4">
          <div>
            <span className="text-[11px] font-black text-bordeaux-700 uppercase tracking-widest block mb-1">
              BİLEO DİJİTAL CÜZDAN
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B18] font-display tracking-tight">
              Dijital Cüzdan & Biniş Kartları
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-0.5 font-medium">
              Kayıtlı biletleriniz, check-in durumu ve 1-tık anında iade yönetimi
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-charcoal-muted">
            <span>Toplam {tickets.length} Bilet</span>
            <span>•</span>
            <span className="text-bordeaux-700 font-extrabold">
              {tickets.filter(x => x.status === 'active' || x.status === 'confirmed').length} Aktif
            </span>
          </div>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Tickets Explorer */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Search and Category Filter Bar */}
            <div className="space-y-3 pb-3">
              <div className="relative">
                <BileoSearch className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="PNR, güzergah veya yolcu adı..."
                  className="w-full bg-white rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-charcoal placeholder:text-charcoal-muted/70 focus:outline-none shadow-soft transition-colors"
                />
              </div>

              {/* Clean Tab Selector */}
              <div className="flex items-center gap-2 text-xs font-extrabold">
                <button
                  onClick={() => setActiveTabFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTabFilter === 'all'
                      ? 'bg-charcoal text-white'
                      : 'text-charcoal-muted hover:text-charcoal hover:bg-white'
                  }`}
                >
                  Tümü ({tickets.length})
                </button>
                <button
                  onClick={() => setActiveTabFilter('active')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTabFilter === 'active'
                      ? 'bg-bordeaux-700 text-white'
                      : 'text-charcoal-muted hover:text-charcoal hover:bg-white'
                  }`}
                >
                  Geçerli ({tickets.filter((x) => x.status === 'active' || x.status === 'confirmed').length})
                </button>
                <button
                  onClick={() => setActiveTabFilter('refunded')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTabFilter === 'refunded'
                      ? 'bg-rose-700 text-white'
                      : 'text-charcoal-muted hover:text-charcoal hover:bg-white'
                  }`}
                >
                  İade / İptal ({tickets.filter((x) => x.status === 'refunded' || x.status === 'cancelled').length})
                </button>
              </div>
            </div>

            {/* Ticket Item List */}
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1 pt-1 pb-1">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-charcoal-muted bg-white rounded-2xl shadow-soft">
                  <BileoTicket className="w-8 h-8 mx-auto mb-2 text-charcoal-muted/50" />
                  <p className="text-sm font-bold text-charcoal">Eşleşen bilet bulunamadı</p>
                  <p className="text-xs mt-1">Farklı bir arama yapabilir veya yeni sefer bulabilirsiniz.</p>
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = selectedTicket?.pnr === t.pnr;
                  const isCancelled = t.status === 'refunded' || t.status === 'cancelled';

                  return (
                    <div
                      key={t.pnr}
                      onClick={() => setSelectedTicketPnr(t.pnr)}
                      className={`p-4 rounded-2xl transition-all cursor-pointer bg-white ${
                        isSelected
                          ? 'shadow-md border border-[#E2DCD2]'
                          : 'shadow-soft hover:shadow-soft-lg border border-transparent'
                      }`}
                    >
                      {/* Top Row: Authentic Logo, Status & Selected Tick */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-6 flex items-center">
                          <CompanyLogo
                            company={t.route.company}
                            transportType={t.route.transportType}
                            size="sm"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold ${isCancelled ? 'text-rose-700' : 'text-[#1E1B18]'}`}>
                            {isCancelled ? 'İptal / İade' : 'Geçerli Bilet'}
                          </span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-[#1E1B18] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                              <BileoCheck className="w-2.5 h-2.5 stroke-[3] text-emerald-400" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Route Names */}
                      <div className="flex items-center gap-2 text-sm font-extrabold text-[#1E1B18] font-display my-1">
                        <span>{t.route.from}</span>
                        <BileoArrowRight className="w-3.5 h-3.5 text-bordeaux-700 flex-shrink-0" />
                        <span>{t.route.to}</span>
                      </div>

                      {/* Footer Row: PNR, Date & Time */}
                      <div className="mt-2 pt-2 flex items-center justify-between text-xs text-charcoal-muted">
                        <span className="font-mono font-black text-bordeaux-700 text-[11px]">
                          PNR: {t.pnr}
                        </span>
                        <span className="font-medium text-[11px]">
                          {t.route.date} • {t.route.departureTime}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Right Column: Handcrafted Boarding Pass Detail */}
          <div className="lg:col-span-7 sticky top-28">
            {selectedTicket ? (
              <div className="bg-white rounded-3xl shadow-soft-lg overflow-hidden select-none">
                
                {/* Boarding Pass Header (Deep Bordeaux Signature) */}
                <div className="bg-bordeaux-700 text-white p-6 sm:p-7 relative overflow-hidden">
                  
                  {/* Meta Top Row */}
                  <div className="flex items-center justify-between mb-5 pb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-white/90">
                      Biniş Kartı
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black tracking-wider text-white">
                        PNR: {selectedTicket.pnr}
                      </span>
                      <button
                        onClick={() => handleCopy(selectedTicket.pnr)}
                        className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
                        title="PNR Kopyala"
                      >
                        {copiedPnr === selectedTicket.pnr ? (
                          <BileoCheck className="w-3.5 h-3.5 text-emerald-300" />
                        ) : (
                          <BileoCopy className="w-3.5 h-3.5 text-white" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Itinerary Main Display */}
                  <div className="grid grid-cols-12 gap-4 items-center">
                    
                    {/* Origin */}
                    <div className="col-span-4">
                      <span className="text-[10px] text-white/70 uppercase tracking-wider font-extrabold block">
                        KALKIŞ
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white mt-0.5">
                        {selectedTicket.route.from}
                      </h3>
                      <div className="text-xs text-white/90 font-bold mt-1">
                        <span>{selectedTicket.route.departureTime}</span>
                      </div>
                    </div>

                    {/* Center Route Line & Duration */}
                    <div className="col-span-4 flex flex-col items-center justify-center text-center">
                      <div className="w-full flex items-center justify-center gap-1 text-white/60 text-xs">
                        <span className="h-[1px] flex-1 bg-white/30" />
                        <span className="text-[11px] font-bold text-white/90 px-1">
                          {selectedTicket.route.duration}
                        </span>
                        <span className="h-[1px] flex-1 bg-white/30" />
                      </div>
                      <span className="text-[10px] text-white/70 font-semibold mt-0.5">
                        Direkt Sefer
                      </span>
                    </div>

                    {/* Destination */}
                    <div className="col-span-4 text-right">
                      <span className="text-[10px] text-white/70 uppercase tracking-wider font-extrabold block">
                        VARIŞ
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white mt-0.5">
                        {selectedTicket.route.to}
                      </h3>
                      <div className="flex items-center justify-end gap-1 text-xs text-white/90 font-bold mt-1">
                        <span>{selectedTicket.route.date}</span>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Physical Perforated Tear-off Line */}
                <div className="relative w-full h-0 z-20">
                  <div className="absolute left-[-12px] top-[-12px] w-6 h-6 rounded-full bg-[#FBF9F5]" />
                  <div className="absolute right-[-12px] top-[-12px] w-6 h-6 rounded-full bg-[#FBF9F5]" />
                  <div className="border-t-2 border-dashed border-[#E8E1D5] w-full" />
                </div>

                {/* Boarding Details Body */}
                <div className="p-6 sm:p-7 space-y-5 bg-white">
                  
                  {/* Carrier Brand Row in White Section */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#E2DCD2]/60">
                    <div className="flex items-center gap-3">
                      <CompanyLogo
                        company={selectedTicket.route.company}
                        transportType={selectedTicket.route.transportType}
                        size="md"
                      />
                      <span className="text-xs font-bold text-[#1E1B18]">
                        {selectedTicket.route.company}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-charcoal-muted">
                      {selectedTicket.route.vehicleType}
                    </span>
                  </div>
                  
                  {/* 4-Column Key Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5">
                    <div>
                      <span className="text-[11px] text-charcoal-muted font-bold block mb-0.5">
                        Yolcu
                      </span>
                      <span className="text-xs font-black text-charcoal truncate block">
                        {selectedTicket.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(', ')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-charcoal-muted font-bold block mb-0.5">
                        Koltuk No
                      </span>
                      <span className="text-sm font-black text-bordeaux-700 font-display">
                        {selectedTicket.seats.map((s) => typeof s === 'object' ? s.number : s).join(', ')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-charcoal-muted font-bold block mb-0.5">
                        Peron / Kapı
                      </span>
                      <span className="text-xs font-black text-charcoal">
                        {selectedTicket.route.gateOrPlatform || 'Peron 14'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-charcoal-muted font-bold block mb-0.5">
                        Ödenen Tutar
                      </span>
                      <span className="text-sm font-black text-charcoal font-display">
                        {selectedTicket.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </span>
                    </div>
                  </div>

                  {/* Departure & Arrival Terminals */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-charcoal-muted font-bold flex-shrink-0">
                        Kalkış Terminali:
                      </span>
                      <span className="font-extrabold text-charcoal text-right">
                        {selectedTicket.route.fromTerminal}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-charcoal-muted font-bold flex-shrink-0">
                        Varış Terminali:
                      </span>
                      <span className="font-extrabold text-charcoal text-right">
                        {selectedTicket.route.toTerminal}
                      </span>
                    </div>
                  </div>

                  {/* Barcode & Action Buttons */}
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Visual Barcode */}
                    <div>
                      <div className="w-48 h-8 barcode-pattern opacity-85 rounded-sm" />
                      <p className="text-[10px] font-mono font-bold text-charcoal-muted mt-1 tracking-widest uppercase">
                        *{selectedTicket.pnr}-{selectedTicket.route.transportType.toUpperCase()}*
                      </p>
                    </div>

                    {/* Actions: WhatsApp Share, Print & Refund */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <button
                        onClick={() => {
                          const passengerNames = selectedTicket.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(', ');
                          const msg = encodeURIComponent(`Bileo E-Bilet Bilgisi:\nPNR: ${selectedTicket.pnr}\nFirma: ${selectedTicket.route.company}\nGüzergah: ${selectedTicket.route.from} ➔ ${selectedTicket.route.to}\nTarih: ${selectedTicket.route.date} ${selectedTicket.route.departureTime}\nYolcu: ${passengerNames}\nKoltuk: ${selectedTicket.seats.join(', ')}\nBiletinizi https://bileo.vercel.app adresinden sorgulayabilirsiniz.`);
                          window.open(`https://wa.me/?text=${msg}`, '_blank');
                        }}
                        className="text-emerald-700 hover:text-emerald-800 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Bileti WhatsApp ile Paylaş"
                      >
                        <span>WhatsApp’ta Paylaş</span>
                      </button>

                      <button
                        onClick={handlePrint}
                        className="text-charcoal hover:text-bordeaux-700 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <BileoPrinter className="w-4 h-4" />
                        <span>Yazdır</span>
                      </button>

                      {selectedTicket.status !== 'refunded' && selectedTicket.status !== 'cancelled' && (
                        <button
                          onClick={() => onOpenRefund(selectedTicket)}
                          className="text-rose-700 hover:text-rose-800 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <BileoRotateCcw className="w-4 h-4" />
                          <span>İptal & İade</span>
                        </button>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-charcoal-muted shadow-soft">
                <BileoTicket className="w-12 h-12 mx-auto mb-3 text-charcoal-muted/40" />
                <h3 className="text-base font-bold text-charcoal">Bilet Seçiniz</h3>
                <p className="text-xs mt-1">Detayları ve biniş kartını görüntülemek için sol taraftan bir bilet seçin.</p>
              </div>
            )}
          </div>

        </div>

      </main>

    </div>
  );
};
