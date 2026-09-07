import React, { useState } from 'react';
import {
  BileoClose,
  BileoShieldCheck,
  BileoRefreshCw,
  BileoCheckCircle,
} from './icons';
import { SampleDataNotice } from './common/SampleDataNotice';
import { sound } from '../utils/sound';

interface HighwayPassesLiveRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info' | 'promo', duration?: number) => void;
}

interface MountainPassData {
  id: string;
  name: string;
  corridor: string;
  altitude: string;
  status: 'open' | 'caution' | 'restricted';
  statusText: string;
  weatherText: string;
  temp: string;
  windSpeed: string;
  visibility: string;
  chainRequired: boolean;
  trucksAllowed: boolean;
  tunnelInfo: string;
  captainNote: string;
  lastUpdated: string;
}

const PASS_DATA: MountainPassData[] = [
  {
    id: 'bolu_dagi',
    name: 'Bolu Dağı Geçidi & Tüneli',
    corridor: 'İstanbul - Ankara (O-4 / D-100)',
    altitude: '950 m',
    status: 'open',
    statusText: 'Trafik Akıcı - Tünel Açık',
    weatherText: 'Hafif Sisli / Islak Zemin',
    temp: '4°C',
    windSpeed: '18 km/s',
    visibility: '450 m',
    chainRequired: false,
    trucksAllowed: true,
    tunnelInfo: '3.125 m çift tüp Bolu Tüneli aktif, hız sınırı 70 km/s.',
    captainNote: 'Elmalık ve Viyadükler mevkisinde sabah saatlerinde gizli buzlanma riski olabilir; takip mesafesini 2 katına çıkarın.',
    lastUpdated: '10 dk önce',
  },
  {
    id: 'osmangazi',
    name: 'Osmangazi Köprüsü & Körfez Koridoru',
    corridor: 'İstanbul - Bursa - İzmir (O-5 Otoyolu)',
    altitude: '64 m (Deniz Seviyesi)',
    status: 'open',
    statusText: 'Tam Kapasite Açık',
    weatherText: 'Açık / Rüzgar Normal',
    temp: '14°C',
    windSpeed: '28 km/s',
    visibility: '10 km',
    chainRequired: false,
    trucksAllowed: true,
    tunnelInfo: 'Orhangazi ve Selçukgazi tünelleri sorunsuz hizmet veriyor.',
    captainNote: 'Köprü üzerinde yan rüzgar algılayıcıları devrede; 70 km/s üzeri fırtınalarda yüksek kasalı araçlar uyarılır.',
    lastUpdated: '5 dk önce',
  },
  {
    id: 'zigana_kop',
    name: 'Yeni Zigana & Kop Dağı Tünel Koridoru',
    corridor: 'Trabzon - Gümüşhane - Erzurum (D-885)',
    altitude: '1.200 m (Eski Zirve: 2.050 m)',
    status: 'open',
    statusText: 'Yeni Tünel ile Kesintisiz',
    weatherText: 'Parçalı Bulutlu',
    temp: '1°C',
    windSpeed: '12 km/s',
    visibility: '8 km',
    chainRequired: false,
    trucksAllowed: true,
    tunnelInfo: '14.476 m dünyanın 3. en uzun çift tüp tüneli sayesinde kış geçişleri 20 dakikaya indi.',
    captainNote: 'Tünel çıkışı Gümüşhane tarafında hava sıcaklığı 5 derece düşebilir, viyadüklerde hızınızı kontrol edin.',
    lastUpdated: '12 dk önce',
  },
  {
    id: 'toroslar_pozanti',
    name: 'Toroslar Pozantı & Gülek Boğazı',
    corridor: 'Ankara - Adana - Mersin (O-21 / D-750)',
    altitude: '1.250 m',
    status: 'open',
    statusText: 'Açık - Ağır Vasıta Şeritleri Aktif',
    weatherText: 'Rüzgarlı / Serin',
    temp: '8°C',
    windSpeed: '35 km/s',
    visibility: '10 km',
    chainRequired: false,
    trucksAllowed: true,
    tunnelInfo: 'Tekir ve Damlama tünel tüpleri çift yönlü akıcı.',
    captainNote: 'Pozantı inişinde uzun süreli fren kullanımından kaçının; motor kompresyon frenini tercih edin.',
    lastUpdated: '8 dk önce',
  },
  {
    id: 'canakkale_1915',
    name: '1915 Çanakkale Köprüsü & Malkara Koridoru',
    corridor: 'İstanbul / Tekirdağ - Çanakkale - Balıkesir',
    altitude: '70 m (Deniz Seviyesi)',
    status: 'open',
    statusText: 'Hızlı Transit Açık',
    weatherText: 'Kuvvetli Lodos / Açık',
    temp: '13°C',
    windSpeed: '42 km/s',
    visibility: '10 km',
    chainRequired: false,
    trucksAllowed: true,
    tunnelInfo: 'Malkara-Çanakkale kesimi 89 km otoyol standartlarında.',
    captainNote: 'Lodos fırtınasında feribot seferleri durduğunda köprü kesintisiz alternatif oluşturur.',
    lastUpdated: '3 dk önce',
  },
  {
    id: 'sertavul_gecidi',
    name: 'Sertavul Geçidi & Karaman Bağlantısı',
    corridor: 'Konya / Karaman - Mersin / Mut (D-715)',
    altitude: '1.650 m',
    status: 'caution',
    statusText: 'Dikkatli Geçiş - Kar Temizleme Yapıldı',
    weatherText: 'Zemin Islak / Kar Kalıntısı',
    temp: '-1°C',
    windSpeed: '24 km/s',
    visibility: '2.5 km',
    chainRequired: false,
    trucksAllowed: true,
    tunnelInfo: 'Geçit boyunca KGM Karayolları 3. Bölge ekipleri tuzlama yapıyor.',
    captainNote: 'Gece ve sabahın ilk saatlerinde donma tehlikesi yüksektir. Kış lastiği olmayan araçların geçişine izin verilmez.',
    lastUpdated: '15 dk önce',
  },
];

export const HighwayPassesLiveRadarModal: React.FC<HighwayPassesLiveRadarModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [selectedPassId, setSelectedPassId] = useState<string>('bolu_dagi');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentPass = PASS_DATA.find((p) => p.id === selectedPassId) || PASS_DATA[0];

  const handleRefresh = () => {
    setIsRefreshing(true);
    sound.playTick();
    setTimeout(() => {
      setIsRefreshing(false);
      sound.playSuccess();
      if (onShowToast) {
        onShowToast(
          'Geçit Telemetrisi Güncellendi',
          'Karayolları Genel Müdürlüğü (KGM) ve Meteoroloji sensör verileri senkronize edildi.',
          'info'
        );
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center border border-amber-200 text-xs font-black font-mono">
              KGM
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Kritik Dağ Geçitleri & Karayolu Tünel Radarı (örnek)</h3>
              <p className="text-xs text-charcoal-muted font-medium">Bolu Dağı, Osmangazi, Toroslar, Zigana geçişleri için örnek yol, hava ve tünel durumu; canlı veri değildir</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#E8E1D5]"
            >
              <BileoRefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Yenileniyor...' : 'Verileri Tazele'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
            >
              <BileoClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        <SampleDataNotice />

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Corridor Selection Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-black text-charcoal uppercase tracking-wider block">
              İncelemek İstediğiniz Ana Geçit / Tüneli Seçin
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PASS_DATA.map((pass) => (
                <button
                  key={pass.id}
                  type="button"
                  onClick={() => { sound.playTick(); setSelectedPassId(pass.id); }}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer shadow-2xs ${
                    selectedPassId === pass.id
                      ? 'bg-bordeaux-900 text-white border-bordeaux-900 shadow-soft'
                      : 'bg-white text-charcoal border-[#E8E1D5] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="font-black text-xs truncate">{pass.name}</div>
                  <div className={`text-[10px] font-medium truncate ${selectedPassId === pass.id ? 'text-rose-200' : 'text-charcoal-muted'}`}>
                    Rakım: {pass.altitude} • {pass.statusText.split(' - ')[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Pass Live Telemetry Card */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8E1D5] shadow-sm space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E1D5] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-[#1E1B18] font-display">{currentPass.name}</h4>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      currentPass.status === 'open'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {currentPass.statusText}
                  </span>
                </div>
                <p className="text-xs text-charcoal-muted font-medium pt-0.5">{currentPass.corridor}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-charcoal-muted block">Sensör Güncellemesi</span>
                <span className="text-xs font-mono font-bold text-charcoal">{currentPass.lastUpdated}</span>
              </div>
            </div>

            {/* Metrics 4-Box Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                <span className="text-[10px] text-charcoal-muted block font-bold uppercase tracking-wider">Hava Sıcaklığı</span>
                <div className="text-lg font-black font-mono text-charcoal">{currentPass.temp}</div>
                <span className="text-[11px] text-charcoal-muted truncate block">{currentPass.weatherText}</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                <span className="text-[10px] text-charcoal-muted block font-bold uppercase tracking-wider">Rüzgar Şiddeti</span>
                <div className="text-lg font-black font-mono text-charcoal">{currentPass.windSpeed}</div>
                <span className="text-[11px] text-charcoal-muted truncate block">Geçit Rüzgarı</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                <span className="text-[10px] text-charcoal-muted block font-bold uppercase tracking-wider">Görüş Mesafesi</span>
                <div className="text-lg font-black font-mono text-charcoal">{currentPass.visibility}</div>
                <span className="text-[11px] text-charcoal-muted truncate block">Sis / Görüş İndeksi</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5]">
                <span className="text-[10px] text-charcoal-muted block font-bold uppercase tracking-wider">Geçit Rakımı</span>
                <div className="text-lg font-black font-mono text-charcoal">{currentPass.altitude}</div>
                <span className="text-[11px] text-charcoal-muted truncate block">Zirve Kotu</span>
              </div>
            </div>

            {/* Tunnel & Infrastructure Specs */}
            <div className="p-4 rounded-2xl bg-cream-50 border border-[#E8E1D5] space-y-1">
              <span className="text-[11px] font-black text-charcoal block uppercase tracking-wider">
                Tünel & Otoyol Altyapı Bilgisi:
              </span>
              <p className="text-xs text-charcoal leading-relaxed font-medium">
                {currentPass.tunnelInfo}
              </p>
            </div>

            {/* Captain's Advisory Note */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
              <span className="text-[11px] font-black text-amber-900 block uppercase tracking-wider">
                Otobüs Kaptanları & Sürücüler İçin Seyir Tavsiyesi:
              </span>
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                {currentPass.captainNote}
              </p>
            </div>

            {/* Compliance Matrix */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <div className="flex items-center gap-1.5 text-charcoal font-bold bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8E1D5]">
                <BileoCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ağır Vasıta & Otobüs Geçişi: <strong>{currentPass.trucksAllowed ? 'Serbest' : 'Kısıtlı'}</strong></span>
              </div>

              <div className="flex items-center gap-1.5 text-charcoal font-bold bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8E1D5]">
                <BileoCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zincir / Takoz Zorunluluğu: <strong>{currentPass.chainRequired ? 'Zorunlu' : 'Gerekli Değil'}</strong></span>
              </div>
            </div>

          </div>

          {/* Footer Info */}
          <div className="p-4 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-charcoal-muted font-medium">
              <BileoShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Veriler Karayolları Genel Müdürlüğü (KGM) 1-18. Bölge ve MGM istasyonlarından derlenmektedir.</span>
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
