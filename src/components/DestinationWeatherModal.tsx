import React, { useState } from 'react';
import {
  BileoClose,
  BileoMapPin,
  BileoSparkles,
  BileoCompass,
  BileoAlertCircle,
} from './icons';
import { sound } from '../utils/sound';

interface DestinationWeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCity?: string;
}

interface CityWeather {
  city: string;
  tempC: number;
  condition: 'Güneşli' | 'Parçalı Bulutlu' | 'Açık & Sıcak' | 'Hafif Yağmurlu' | 'Rüzgarlı';
  humidity: string;
  windSpeed: string;
  packingTip: string;
  threeDayForecast: { day: string; temp: string; icon: string }[];
}

/** Said plainly on the screen: this widget is a static sample, not a live forecast. */
export const WEATHER_SAMPLE_DISCLOSURE =
  'Bu ekran temsili bir örnektir: sıcaklık, tahmin ve bavul önerisi canlı bir hava durumu kaynağından gelmez ve seyahat gününüzü yansıtmaz. Güncel tahmin için Meteoroloji Genel Müdürlüğü (mgm.gov.tr) sayfasına bakın.';

const WEATHER_DATA: Record<string, CityWeather> = {
  İstanbul: {
    city: 'İstanbul',
    tempC: 24,
    condition: 'Parçalı Bulutlu',
    humidity: '%62 Nem',
    windSpeed: '18 km/s Poyraz',
    packingTip: 'Boğaz esintisine karşı akşam saatleri için hafif bir hırka veya ceket bulundurmanız önerilir.',
    threeDayForecast: [
      { day: 'Bugün', temp: '24°C / 18°C', icon: '⛅' },
      { day: 'Yarın', temp: '26°C / 19°C', icon: '☀️' },
      { day: 'Pazar', temp: '23°C / 17°C', icon: '🌦️' },
    ],
  },
  Ankara: {
    city: 'Ankara',
    tempC: 22,
    condition: 'Güneşli',
    humidity: '%38 Nem',
    windSpeed: '12 km/s',
    packingTip: 'Karasal iklim sebebiyle gündüz ve gece arasındaki sıcaklık farkına karşı katmanlı giyinin.',
    threeDayForecast: [
      { day: 'Bugün', temp: '22°C / 12°C', icon: '☀️' },
      { day: 'Yarın', temp: '24°C / 13°C', icon: '☀️' },
      { day: 'Pazar', temp: '21°C / 11°C', icon: '⛅' },
    ],
  },
  İzmir: {
    city: 'İzmir',
    tempC: 29,
    condition: 'Açık & Sıcak',
    humidity: '%45 Nem',
    windSpeed: '22 km/s İmbat',
    packingTip: 'Güneş gözlüğü, yüksek korumalı güneş kremi ve pamuklu hafif kıyafetler tercih edin.',
    threeDayForecast: [
      { day: 'Bugün', temp: '29°C / 21°C', icon: '☀️' },
      { day: 'Yarın', temp: '31°C / 22°C', icon: '☀️' },
      { day: 'Pazar', temp: '30°C / 20°C', icon: '☀️' },
    ],
  },
  Antalya: {
    city: 'Antalya',
    tempC: 32,
    condition: 'Açık & Sıcak',
    humidity: '%55 Nem',
    windSpeed: '10 km/s',
    packingTip: 'Plaj eşyaları, deniz ayakkabısı ve terletmeyen keten giysileri valizinize ekleyin.',
    threeDayForecast: [
      { day: 'Bugün', temp: '32°C / 24°C', icon: '☀️' },
      { day: 'Yarın', temp: '33°C / 25°C', icon: '☀️' },
      { day: 'Pazar', temp: '32°C / 23°C', icon: '☀️' },
    ],
  },
  Bursa: {
    city: 'Bursa',
    tempC: 23,
    condition: 'Parçalı Bulutlu',
    humidity: '%58 Nem',
    windSpeed: '14 km/s',
    packingTip: 'Uludağ veya tarihi çarşı gezileri için rahat yürüyüş ayakkabıları tercih edin.',
    threeDayForecast: [
      { day: 'Bugün', temp: '23°C / 16°C', icon: '⛅' },
      { day: 'Yarın', temp: '25°C / 17°C', icon: '☀️' },
      { day: 'Pazar', temp: '22°C / 15°C', icon: '🌦️' },
    ],
  },
  Trabzon: {
    city: 'Trabzon',
    tempC: 20,
    condition: 'Hafif Yağmurlu',
    humidity: '%78 Nem',
    windSpeed: '16 km/s',
    packingTip: 'Karadeniz yağmurlarına karşı kompakt bir şemsiye ve su geçirmez yağmurluk edinin.',
    threeDayForecast: [
      { day: 'Bugün', temp: '20°C / 16°C', icon: '🌧️' },
      { day: 'Yarın', temp: '21°C / 15°C', icon: '🌦️' },
      { day: 'Pazar', temp: '22°C / 17°C', icon: '⛅' },
    ],
  },
};

export const DestinationWeatherModal: React.FC<DestinationWeatherModalProps> = ({
  isOpen,
  onClose,
  initialCity = 'İstanbul',
}) => {
  const [selectedCity, setSelectedCity] = useState<string>(
    WEATHER_DATA[initialCity] ? initialCity : 'İstanbul'
  );

  if (!isOpen) return null;

  const current = WEATHER_DATA[selectedCity] || WEATHER_DATA['İstanbul'];

  const handleCityChange = (city: string) => {
    sound.playTick();
    setSelectedCity(city);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E8E1D5] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E8E1D5] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <BileoCompass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E1B18] font-display">Varış Noktası Hava Durumu (örnek)</h3>
              <p className="text-xs text-charcoal-muted font-medium">Temsili 3 günlük tahmin ve bavul önerisi; canlı veri değildir</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8E1D5] text-charcoal flex items-center justify-center transition-colors cursor-pointer"
          >
            <BileoClose className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* City Selection Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {Object.keys(WEATHER_DATA).map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => handleCityChange(city)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  selectedCity === city
                    ? 'bg-bordeaux-700 text-white shadow-soft'
                    : 'bg-white text-charcoal border border-[#E8E1D5] hover:bg-[#FAF7F2]'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Current Weather Card */}
          <div className="bg-gradient-to-br from-[#1E1B18] to-[#36302A] text-white p-6 rounded-3xl space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-extrabold uppercase tracking-wider">
                  <BileoMapPin className="w-3.5 h-3.5" />
                  <span>{current.city}</span>
                </div>
                <h4 className="text-3xl font-black font-display mt-1">{current.tempC}°C</h4>
                <p className="text-xs text-[#FAF7F2]/80 font-medium">{current.condition}</p>
              </div>
              <div className="text-right space-y-1 text-xs text-[#FAF7F2]/80 font-medium">
                <div>💧 {current.humidity}</div>
                <div>💨 {current.windSpeed}</div>
              </div>
            </div>

            {/* 3 Day Forecast */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
              {current.threeDayForecast.map((f, idx) => (
                <div key={idx} className="bg-white/10 p-2.5 rounded-2xl text-center">
                  <span className="text-[10px] text-[#FAF7F2]/70 font-bold block">{f.day}</span>
                  <span className="text-lg block my-0.5">{f.icon}</span>
                  <span className="text-[11px] font-black text-white">{f.temp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Honesty note: static sample data, never a live forecast */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D5] flex items-start gap-2.5" role="note" data-weather-disclosure>
            <BileoAlertCircle className="w-4 h-4 text-bordeaux-700 shrink-0 mt-0.5" />
            <p className="text-xs text-charcoal-muted leading-relaxed">
              {WEATHER_SAMPLE_DISCLOSURE}{' '}
              <a href="https://www.mgm.gov.tr/" target="_blank" rel="noopener noreferrer" className="font-bold text-bordeaux-700 hover:text-bordeaux-800 underline underline-offset-2">
                mgm.gov.tr
                <span className="sr-only"> (yeni sekmede açılır)</span>
              </a>
            </p>
          </div>

          {/* Packing & Luggage Advice */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wider">
              <BileoSparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Akıllı Bavul & Seyahat Önerisi</span>
            </div>
            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              {current.packingTip}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
