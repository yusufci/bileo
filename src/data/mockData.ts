// Bileo Multi-Modal Transport Mock Dataset & Procedural Cabin Seat Map Generators
// Eliminates all amateur badges and generates authentic multi-modal transport configurations.

import {
  RouteItem,
  DiscoveryCardItem,
  SeatItem,
  TransportType,
  TransportMode,
  SeatLayoutType,
  BookingTicket,
} from '../types';

export const CITIES = [
  'İstanbul',
  'Ankara',
  'İzmir',
  'Antalya',
  'Bursa',
  'Eskişehir',
  'Konya',
  'Trabzon',
  'Adana',
  'Bodrum',
  'Gaziantep',
  'Kayseri',
  'Paris',
  'Londra',
  'Berlin',
  'Roma',
];

export const TERMINALS: Record<string, string[]> = {
  'İstanbul': [
    'Alibeyköy Cep Otogarı',
    'Büyük İstanbul Otogarı (Esenler)',
    'Esenler Otogarı',
    'Harem Otogarı',
    'İstanbul Havalimanı (IST)',
    'Sabiha Gökçen Havalimanı (SAW)',
    'Söğütlüçeşme YHT Garı',
    'Yenikapı İDO İskelesi',
    'Pendik YHT Garı',
  ],
  'Ankara': [
    'AŞTİ Şehirlerarası Otobüs Terminali',
    'Aşti Otogarı',
    'Esenboğa Havalimanı (ESB)',
    'Ankara YHT Garı',
    'Kızılay',
  ],
  'İzmir': [
    'İzmir Şehirlerarası Otobüs Terminali (İZOTAŞ)',
    'İzmir Otogarı',
    'Adnan Menderes Havalimanı (ADB)',
    'Basmane Garı',
    'Alsancak İskelesi',
  ],
  'Antalya': [
    'Antalya Şehirlerarası Otogarı',
    'Antalya Havalimanı (AYT)',
    'Alanya Otogarı',
  ],
  'Bursa': [
    'Bursa Şehirlerarası Otobüs Terminali',
    'Güzelyalı Mudanya İskelesi',
    'Yenişehir Havalimanı',
  ],
  'Eskişehir': [
    'Eskişehir Otogarı',
    'Eskişehir YHT Garı',
  ],
  'Konya': [
    'Konya Şehirlerarası Otobüs Terminali',
    'Konya YHT Garı',
  ],
  'Bodrum': [
    'Bodrum Otogarı',
    'Milas-Bodrum Havalimanı (BJV)',
    'Bodrum Kruvaziyer İskelesi',
  ],
  'Trabzon': [
    'Trabzon Otogarı',
    'Trabzon Havalimanı (TZX)',
  ],
  'Paris': [
    'Paris Charles de Gaulle (CDG)',
    'Paris Orly (ORY)',
    'Gare de Lyon',
  ],
  'Londra': [
    'London Heathrow (LHR)',
    'London Gatwick (LGW)',
    'King\'s Cross Station',
  ],
  'Berlin': [
    'Berlin Brandenburg (BER)',
    'Berlin Hauptbahnhof',
  ],
  'Roma': [
    'Rome Fiumicino (FCO)',
    'Roma Termini',
  ],
};

export const POPULAR_ROUTES: RouteItem[] = [
  // 1. Bus: İstanbul -> Ankara (Kamil Koç 2+1 Rahat Hat)
  {
    id: 'b-101',
    from: 'İstanbul',
    fromTerminal: 'Alibeyköy Cep Otogarı',
    to: 'Ankara',
    toTerminal: 'Aşti Otogarı (AŞTİ)',
    departureTime: '10:30',
    arrivalTime: '16:00',
    duration: '5s 30dk',
    date: '24 Mayıs Cumartesi',
    price: 650,
    originalPrice: 720,
    company: 'Kamil Koç',
    transportType: 'otobus',
    vehicleType: '2+1 Rahat Hat (Mercedes-Benz Travego 16 SHD)',
    availableSeats: 14,
    rating: 4.8,
    reviewCount: 3420,
    features: ['Wi-Fi İnternet', '220V Priz & USB', 'Kişisel Multimedya Ekranı', 'Gurme İkram Servisi'],
    badge: 'Direkt Sefer',
    serviceClass: 'comfort',
    seatLayoutType: 'bus_2_1',
    gateOrPlatform: 'Peron 14',
  },
  // 2. Bus: İstanbul -> Ankara (Pamukkale Jumbo Comfort)
  {
    id: 'b-102',
    from: 'İstanbul',
    fromTerminal: 'Esenler Otogarı',
    to: 'Ankara',
    toTerminal: 'Aşti Otogarı',
    departureTime: '12:00',
    arrivalTime: '17:45',
    duration: '5s 45dk',
    date: '24 Mayıs Cumartesi',
    price: 600,
    originalPrice: 650,
    company: 'Pamukkale Turizm',
    transportType: 'otobus',
    vehicleType: '2+1 Jumbo Comfort (Neoplan Tourliner)',
    availableSeats: 8,
    rating: 4.9,
    reviewCount: 2890,
    features: ['5G Wi-Fi', 'Bireysel Priz', 'Sıcak & Soğuk İkram', 'Geniş Koltuk Aralığı'],
    badge: 'Jumbo Hat',
    serviceClass: 'vip',
    seatLayoutType: 'bus_2_1',
    gateOrPlatform: 'Peron 22',
  },
  // 3. Bus: İstanbul -> İzmir (Varan Turizm VIP Express)
  {
    id: 'b-103',
    from: 'İstanbul',
    fromTerminal: 'Alibeyköy Cep Otogarı',
    to: 'İzmir',
    toTerminal: 'İzmir Otogarı (İZOTAŞ)',
    departureTime: '08:00',
    arrivalTime: '13:30',
    duration: '5s 30dk',
    date: '24 Mayıs Cuma',
    price: 450,
    originalPrice: 520,
    company: 'Varan Turizm',
    transportType: 'otobus',
    vehicleType: '2+1 VIP Express (Setra TopClass S 516)',
    availableSeats: 19,
    rating: 4.7,
    reviewCount: 1540,
    features: ['Yüksek Hızlı Wi-Fi', 'USB-C Hızlı Şarj', 'Kişiye Özel Kulaklık', 'Sıcak İçecek Servisi'],
    badge: 'VIP Express',
    serviceClass: 'vip',
    seatLayoutType: 'bus_2_1',
    gateOrPlatform: 'Peron 07',
  },
  // 4. Bus: İstanbul -> Antalya (Ali Osman Ulusoy Suit)
  {
    id: 'b-104',
    from: 'İstanbul',
    fromTerminal: 'Harem Otogarı',
    to: 'Antalya',
    toTerminal: 'Antalya Şehirlerarası Otogarı',
    departureTime: '09:30',
    arrivalTime: '18:45',
    duration: '9s 15dk',
    date: '25 Mayıs Cumartesi',
    price: 700,
    originalPrice: 790,
    company: 'Ali Osman Ulusoy',
    transportType: 'otobus',
    vehicleType: '2+2 Suit Comfort (MAN Lion\'s Coach)',
    availableSeats: 16,
    rating: 4.6,
    reviewCount: 980,
    features: ['Wi-Fi', '220V Priz', 'Snack İkram', 'Yatar Ortopedik Koltuk'],
    badge: 'Ekspres Hat',
    serviceClass: 'comfort',
    seatLayoutType: 'bus_2_2',
    gateOrPlatform: 'Peron 19',
  },
  // 5. Flight: İstanbul -> Paris (Turkish Airlines A321neo)
  {
    id: 'u-201',
    from: 'İstanbul',
    fromTerminal: 'İstanbul Havalimanı (IST)',
    to: 'Paris',
    toTerminal: 'Paris Charles de Gaulle (CDG)',
    departureTime: '14:20',
    arrivalTime: '17:05',
    duration: '3s 45dk',
    date: '27 Mayıs Pazartesi',
    price: 2150,
    originalPrice: 2450,
    company: 'Türk Hava Yolları',
    transportType: 'ucak',
    vehicleType: 'Airbus A321neo (TK1825)',
    aircraftModel: 'Airbus A321neo',
    availableSeats: 22,
    rating: 4.9,
    reviewCount: 8400,
    features: ['23kg Bagaj + 8kg Kabin', 'Sıcak Gurme Yemek İkramı', 'Flyers Wi-Fi', '4K HD Dokunmatik Ekran'],
    badge: 'Tarifeli Sefer',
    serviceClass: 'business',
    seatLayoutType: 'plane_3_3',
    gateOrPlatform: 'Kapı F12',
  },
  // 6. Flight: İstanbul -> Ankara (Pegasus B737-800)
  {
    id: 'u-202',
    from: 'İstanbul',
    fromTerminal: 'Sabiha Gökçen Havalimanı (SAW)',
    to: 'Ankara',
    toTerminal: 'Esenboğa Havalimanı (ESB)',
    departureTime: '07:15',
    arrivalTime: '08:20',
    duration: '1s 05dk',
    date: '24 Mayıs Cumartesi',
    price: 890,
    originalPrice: 1050,
    company: 'Pegasus',
    transportType: 'ucak',
    vehicleType: 'Boeing 737-800 (PC2660)',
    aircraftModel: 'Boeing 737-800',
    availableSeats: 11,
    rating: 4.5,
    reviewCount: 4200,
    features: ['15kg Bagaj Dahil', 'Hızlı Online Check-in', 'Mobil Biniş Kartı', 'Kabin İçi Satış'],
    badge: 'Direkt Uçuş',
    serviceClass: 'standard',
    seatLayoutType: 'plane_3_3',
    gateOrPlatform: 'Kapı 204B',
  },
  // 7. Train: Ankara -> Konya (Siemens Velaro YHT)
  {
    id: 't-301',
    from: 'Ankara',
    fromTerminal: 'Ankara YHT Garı',
    to: 'Konya',
    toTerminal: 'Konya YHT Garı',
    departureTime: '11:00',
    arrivalTime: '12:45',
    duration: '1s 45dk',
    date: '24 Mayıs Cuma',
    price: 240,
    originalPrice: 280,
    company: 'TCDD Taşımacılık',
    transportType: 'tren',
    vehicleType: 'Siemens Velaro YHT (300 km/s)',
    trainSeries: 'Siemens Velaro HT80000',
    availableSeats: 35,
    rating: 4.9,
    reviewCount: 6100,
    features: ['Yüksek Hızlı Hat (300 km/s)', 'Bistro Vagonu & Kafe', 'Geniş Çalışma Masası', '220V Priz Her Koltukta'],
    badge: 'Yüksek Hızlı Tren',
    serviceClass: 'business',
    seatLayoutType: 'train_2_2',
    gateOrPlatform: 'Hat 3 (Peron B)',
  },
  // 8. Train: İstanbul -> Eskişehir (CAF YHT Express)
  {
    id: 't-302',
    from: 'İstanbul',
    fromTerminal: 'Söğütlüçeşme YHT Garı',
    to: 'Eskişehir',
    toTerminal: 'Eskişehir YHT Garı',
    departureTime: '06:45',
    arrivalTime: '09:40',
    duration: '2s 55dk',
    date: '24 Mayıs Cumartesi',
    price: 340,
    company: 'TCDD Taşımacılık',
    transportType: 'tren',
    vehicleType: 'CAF YHT Express (HT65000)',
    trainSeries: 'CAF HT65000',
    availableSeats: 18,
    rating: 4.8,
    reviewCount: 3800,
    features: ['Business & Ekonomi Seçeneği', 'Geniş Diz Mesafesi', 'Bireysel Elektrik Prizi', 'Bistro Hizmeti'],
    badge: 'YHT Ekspres',
    serviceClass: 'comfort',
    seatLayoutType: 'train_2_2',
    gateOrPlatform: 'Hat 1 (Peron A)',
  },
  // 9. Ferry: İstanbul -> Bursa (İDO Hızlı Katamaran)
  {
    id: 'f-401',
    from: 'İstanbul',
    fromTerminal: 'Yenikapı İDO İskelesi',
    to: 'Bursa',
    toTerminal: 'Güzelyalı Mudanya İskelesi',
    departureTime: '09:00',
    arrivalTime: '10:35',
    duration: '1s 35dk',
    date: '24 Mayıs Cumartesi',
    price: 290,
    originalPrice: 330,
    company: 'İDO (İstanbul Deniz Otobüsleri)',
    transportType: 'feribot',
    vehicleType: 'Hızlı Katamaran Deniz Otobüsü',
    vesselType: 'Hızlı Katamaran (Fatih Sultan Mehmet)',
    availableSeats: 48,
    rating: 4.7,
    reviewCount: 2150,
    features: ['Panoramik Deniz Manzarası', 'Kafeterya & Snack Bar', 'Açık Seyir Güvertesi', 'Kesintisiz Hızlı Geçiş'],
    badge: 'Deniz Otobüsü',
    serviceClass: 'comfort',
    seatLayoutType: 'ferry_deck',
    gateOrPlatform: 'İskele 2',
  },
  // 10. Ferry: Bodrum -> İzmir (BUDO Express Katamaran)
  {
    id: 'f-402',
    from: 'Bodrum',
    fromTerminal: 'Bodrum Kruvaziyer İskelesi',
    to: 'İzmir',
    toTerminal: 'Alsancak İskelesi',
    departureTime: '15:30',
    arrivalTime: '18:15',
    duration: '2s 45dk',
    date: '25 Mayıs Pazar',
    price: 480,
    company: 'BUDO Express',
    transportType: 'feribot',
    vehicleType: 'Katamaran Hızlı Deniz Otobüsü',
    vesselType: 'BUDO Fast Catamaran',
    availableSeats: 29,
    rating: 4.6,
    reviewCount: 890,
    features: ['Kafeterya', 'Panoramik Salon', 'Ergonomik Koltuklar', 'Açık Güverte'],
    badge: 'Ekspres Sefer',
    serviceClass: 'standard',
    seatLayoutType: 'ferry_deck',
    gateOrPlatform: 'İskele 1',
  },
];

export const DISCOVERY_CARDS: DiscoveryCardItem[] = [
  {
    id: 'disc-1',
    from: 'İstanbul',
    to: 'İzmir',
    company: 'Kamil Koç',
    date: '24 Mayıs Cuma',
    time: '08:00',
    price: 450,
    transportType: 'otobus',
    badge: 'Karayolu Express',
    categoryTag: 'Karayolu',
    regionTag: 'Ege Kıyı Güzergahı',
    cityCodeFrom: 'IST',
    cityCodeTo: 'IZM',
    duration: '5s 30dk',
    vehicleModel: '2+1 Rahat Hat',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop',
    tagTitle: 'Ege Kıyı Güzergahı',
  },
  {
    id: 'disc-3',
    from: 'İstanbul',
    to: 'Paris',
    company: 'Türk Hava Yolları',
    date: '27 Mayıs Pazartesi',
    time: '14:20',
    price: 2150,
    transportType: 'ucak',
    badge: 'Uluslararası Uçuş',
    categoryTag: 'Havacılık',
    regionTag: 'Avrupa Seferi',
    cityCodeFrom: 'IST',
    cityCodeTo: 'CDG',
    duration: '3s 45dk',
    vehicleModel: 'Airbus A321neo',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop',
    tagTitle: 'Avrupa Seferi',
  },
  {
    id: 'disc-4',
    from: 'Ankara',
    to: 'Konya',
    company: 'TCDD Taşımacılık',
    date: '24 Mayıs Cuma',
    time: '11:00',
    price: 240,
    transportType: 'tren',
    badge: 'Yüksek Hızlı Tren',
    categoryTag: 'Demiryolu',
    regionTag: 'İç Anadolu Hattı',
    cityCodeFrom: 'ANK',
    cityCodeTo: 'KYA',
    duration: '1s 45dk',
    vehicleModel: 'Siemens Velaro YHT',
    image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=800&auto=format&fit=crop',
    tagTitle: 'İç Anadolu Demiryolu',
  },
  {
    id: 'disc-2',
    from: 'İstanbul',
    to: 'Antalya',
    company: 'Pamukkale Turizm',
    date: '25 Mayıs Cumartesi',
    time: '09:30',
    price: 700,
    transportType: 'otobus',
    badge: 'Akdeniz Sahil Yolu',
    categoryTag: 'Karayolu',
    regionTag: 'Akdeniz Hattı',
    cityCodeFrom: 'IST',
    cityCodeTo: 'AYT',
    duration: '9s 15dk',
    vehicleModel: 'Travego Special',
    image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=800&auto=format&fit=crop',
    tagTitle: 'Akdeniz Sahil Yolu',
  },
  {
    id: 'disc-5',
    from: 'İstanbul',
    to: 'Bursa',
    company: 'İDO',
    date: '24 Mayıs Cumartesi',
    time: '09:00',
    price: 290,
    transportType: 'feribot',
    badge: 'Deniz Seferi (İDO)',
    categoryTag: 'Denizyolu',
    regionTag: 'Marmara Geçişi',
    cityCodeFrom: 'YEN',
    cityCodeTo: 'MUD',
    duration: '1s 35dk',
    vehicleModel: 'Katamaran Hızlı Feribot',
    image: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?q=80&w=800&auto=format&fit=crop',
    tagTitle: 'Marmara Geçişi',
  },
  {
    id: 'disc-6',
    from: 'İstanbul',
    to: 'Bodrum',
    company: 'Varan Turizm',
    date: '28 Mayıs Çarşamba',
    time: '21:00',
    price: 850,
    transportType: 'otobus',
    badge: 'Gece Ekspresi',
    categoryTag: 'Karayolu',
    regionTag: 'Ege Kıyıları',
    cityCodeFrom: 'IST',
    cityCodeTo: 'BJV',
    duration: '10s 00dk',
    vehicleModel: '2+1 VIP Lounge',
    image: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?q=80&w=800&auto=format&fit=crop',
    tagTitle: 'Bodrum Yarımadası',
  },
];

export const WHY_BILEO_FEATURES = [
  {
    id: 'fast',
    title: 'Hızlı ve Kolay',
    description: 'Biletinizi saniyeler içinde seçin, gereksiz formlar ve karışıklık olmadan doğrudan yolculuğunuza odaklanın.',
    icon: 'Clock',
  },
  {
    id: 'secure',
    title: 'Güvenli Alışveriş',
    description: 'Tüm ödemeleriniz 256-bit SSL şifreleme ve banka düzeyinde 3D Secure altyapısıyla korunur.',
    icon: 'ShieldCheck',
  },
  {
    id: 'refund',
    title: 'Koşulsuz İade Güvencesi',
    description: 'Sefer kalkışına kadar kesintisiz, anında iptal ve online iade hakkı ile planlarınız güvende.',
    icon: 'RefreshCw',
  },
  {
    id: 'smart',
    title: 'Çoklu Taşıma Kıyaslaması',
    description: 'Otobüs, tren, uçak ve feribot alternatiflerini tek ekranda süre, güzergah ve net fiyatla karşılaştırın.',
    icon: 'Sparkles',
  },
];

export const SHOWCASE_TICKET: RouteItem = {
  id: 'b-showcase',
  from: 'İstanbul',
  fromTerminal: 'Alibeyköy Cep Otogarı',
  to: 'Ankara',
  toTerminal: 'Aşti Otogarı',
  departureTime: '10:30',
  arrivalTime: '16:00',
  duration: '5s 30dk',
  date: '24 Mayıs Cumartesi',
  price: 650,
  originalPrice: 720,
  company: 'Kamil Koç',
  transportType: 'otobus',
  vehicleType: '2+1 Rahat Hat (Mercedes-Benz Travego 16 SHD)',
  availableSeats: 12,
  rating: 4.9,
  reviewCount: 4120,
  features: ['Wi-Fi', '220V Priz', 'Sıcak İkram', 'Multimedya'],
  badge: 'Özel Sefer',
  serviceClass: 'comfort',
  seatLayoutType: 'bus_2_1',
  gateOrPlatform: 'Peron 14',
};

// ============================================================================
// PROCEDURAL SEAT MAP GENERATORS (4 TRANSPORT MODES)
// ============================================================================

/**
 * Generates an authentic 2+1 Bus Seat Layout (Single seats left + Double seats right).
 * Total 10 rows: Rows 1-9 (1 Single + 2 Double), Row 10 Rear Row (4 contiguous seats).
 */
export function generateBus2Plus1Seats(basePrice: number): SeatItem[] {
  const seats: SeatItem[] = [];
  let seatNum = 1;
  const totalRows = 10;

  for (let r = 1; r <= totalRows; r++) {
    if (r === totalRows) {
      // Rear Row: 4 seats across columns 1, 2, 3, 4
      for (let c = 1; c <= 4; c++) {
        const isMale = (seatNum * 7) % 5 === 0;
        const isFemale = (seatNum * 11) % 7 === 0 && !isMale;
        const status = isMale ? 'taken_male' : isFemale ? 'taken_female' : 'empty';

        seats.push({
          id: `bus-seat-${seatNum}`,
          number: seatNum,
          seatNumber: String(seatNum),
          row: r,
          col: c,
          tier: 'standard',
          type: 'standard',
          status,
          price: basePrice,
          gender: isMale ? 'male' : isFemale ? 'female' : 'none',
          label: `Koltuk ${seatNum} (Arka Sıra)`,
        });
        seatNum++;
      }
    } else {
      // Left side: Single seat (col 1)
      const isMale1 = (seatNum * 3) % 5 === 0;
      const isFemale1 = (seatNum * 7) % 6 === 0 && !isMale1;
      const status1 = isMale1 ? 'taken_male' : isFemale1 ? 'taken_female' : 'empty';

      seats.push({
        id: `bus-seat-${seatNum}`,
        number: seatNum,
        seatNumber: String(seatNum),
        row: r,
        col: 1,
        tier: 'single',
        type: 'single',
        status: status1,
        price: basePrice + 30,
        gender: isMale1 ? 'male' : isFemale1 ? 'female' : 'none',
        label: `Koltuk ${seatNum} (Tekli Rahat Koltuk)`,
      });
      seatNum++;

      // Right side: Double seats (col 3 window and col 4 aisle)
      const isMale2 = (seatNum * 5) % 4 === 0;
      const isFemale2 = (seatNum * 9) % 5 === 0 && !isMale2;
      const status2 = isMale2 ? 'taken_male' : isFemale2 ? 'taken_female' : 'empty';

      seats.push({
        id: `bus-seat-${seatNum}`,
        number: seatNum,
        seatNumber: String(seatNum),
        row: r,
        col: 3,
        tier: 'window',
        type: 'window',
        status: status2,
        price: basePrice,
        gender: isMale2 ? 'male' : isFemale2 ? 'female' : 'none',
        label: `Koltuk ${seatNum} (Cam Kenarı)`,
      });
      seatNum++;

      const isMale3 = (seatNum * 13) % 4 === 0;
      const isFemale3 = (seatNum * 17) % 6 === 0 && !isMale3;
      const status3 = isMale3 ? 'taken_male' : isFemale3 ? 'taken_female' : 'empty';

      seats.push({
        id: `bus-seat-${seatNum}`,
        number: seatNum,
        seatNumber: String(seatNum),
        row: r,
        col: 4,
        tier: 'aisle',
        type: 'aisle',
        status: status3,
        price: basePrice,
        gender: isMale3 ? 'male' : isFemale3 ? 'female' : 'none',
        label: `Koltuk ${seatNum} (Koridor)`,
      });
      seatNum++;
    }
  }

  // Ensure seat 7 and seat 14 are guaranteed empty for delightful demo interactions
  const seat7 = seats.find((s) => s.number === 7);
  if (seat7) {
    seat7.status = 'empty';
    seat7.gender = 'none';
  }
  const seat14 = seats.find((s) => s.number === 14);
  if (seat14) {
    seat14.status = 'empty';
    seat14.gender = 'none';
  }

  return seats;
}

/**
 * Generates an authentic 2+2 Classic Bus Seat Layout (4 seats per row).
 */
export function generateBus2Plus2Seats(basePrice: number): SeatItem[] {
  const seats: SeatItem[] = [];
  let seatNum = 1;
  const totalRows = 11;

  for (let r = 1; r <= totalRows; r++) {
    for (let c = 1; c <= 4; c++) {
      const isMale = (seatNum * 4) % 6 === 0;
      const isFemale = (seatNum * 9) % 7 === 0 && !isMale;
      const status = isMale ? 'taken_male' : isFemale ? 'taken_female' : 'empty';
      const isWindow = c === 1 || c === 4;

      seats.push({
        id: `bus-2x2-seat-${seatNum}`,
        number: seatNum,
        seatNumber: String(seatNum),
        row: r,
        col: c,
        tier: isWindow ? 'window' : 'aisle',
        type: isWindow ? 'window' : 'aisle',
        status,
        price: basePrice,
        gender: isMale ? 'male' : isFemale ? 'female' : 'none',
        label: `Koltuk ${seatNum} (${isWindow ? 'Cam Kenarı' : 'Koridor'})`,
      });
      seatNum++;
    }
  }

  return seats;
}

/**
 * Generates an authentic Airplane Cabin Map (Boeing 737 / Airbus A321).
 * Features:
 * - Business Class (Rows 1-3): 2+2 layout (A, C | D, F) with wider pitch & gourmet catering (+350 TL).
 * - Economy Class (Rows 4-22): 3+3 layout (A, B, C | D, E, F).
 * - Emergency Exit Rows (Rows 11-12): Extra legroom seats (+90 TL) and isExitRow=true.
 * - Wing indicators (Rows 9-16).
 */
export function generateAirplaneSeats(
  basePrice: number,
  aircraftModel: string = 'Airbus A321neo'
): SeatItem[] {
  const seats: SeatItem[] = [];
  const colLettersBusiness = ['A', 'C', 'D', 'F'];
  const colLettersEconomy = ['A', 'B', 'C', 'D', 'E', 'F'];

  // 1. Business Class (Rows 1-3, 2+2)
  for (let r = 1; r <= 3; r++) {
    colLettersBusiness.forEach((letter, colIdx) => {
      const seatId = `${r}${letter}`;
      const isTaken = (r + colIdx) % 3 === 0;

      seats.push({
        id: `plane-seat-${seatId}`,
        number: seatId,
        seatNumber: seatId,
        row: r,
        col: colIdx + 1,
        tier: 'business',
        type: 'business',
        status: isTaken ? 'booked' : 'empty',
        price: basePrice + 350,
        cabinClass: 'business',
        hasPowerSocket: true,
        label: `${aircraftModel} - Koltuk ${seatId} (Business Class)`,
      });
    });
  }

  // 2. Economy Class (Rows 4-22, 3+3)
  for (let r = 4; r <= 22; r++) {
    const isExitRow = r === 11 || r === 12;
    const isWing = r >= 9 && r <= 16;

    colLettersEconomy.forEach((letter, colIdx) => {
      const seatId = `${r}${letter}`;
      const isWindow = letter === 'A' || letter === 'F';
      const isAisle = letter === 'C' || letter === 'D';
      const isTaken = (r * 7 + colIdx * 3) % 4 === 0;

      let tier: SeatItem['tier'] = 'standard';
      let price = basePrice;

      if (isExitRow) {
        tier = 'exit_row';
        price = basePrice + 90;
      } else if (isWindow) {
        tier = 'window';
      } else if (isAisle) {
        tier = 'aisle';
      }

      seats.push({
        id: `plane-seat-${seatId}`,
        number: seatId,
        seatNumber: seatId,
        row: r,
        col: colIdx + 1,
        tier,
        type: isExitRow ? 'extra_legroom' : isWindow ? 'window' : isAisle ? 'aisle' : 'standard',
        status: isTaken ? 'booked' : 'empty',
        price,
        cabinClass: 'economy',
        isExitRow,
        wingPosition: isWing,
        hasPowerSocket: true,
        label: `${aircraftModel} - Koltuk ${seatId} (${isExitRow ? 'Acil Çıkış / Geniş Diz Mesafesi' : isWindow ? 'Cam Kenarı' : 'Ekonomi'})`,
      });
    });
  }

  return seats;
}

/**
 * Generates an authentic High-Speed Train Carriage (Siemens Velaro HT80000 / CAF YHT).
 * Features:
 * - Carriage 1: Business (2+1 layout, power sockets, quiet car, +70 TL).
 * - Carriage 2: Economy (2+2 layout, ergonomic seats).
 * - Carriage 3: Bistro & Dining (Bistro bar counter, dining tables).
 * - Carriage 4: Table & Family Car (4-seat facing table clusters).
 */
export function generateTrainSeats(
  basePrice: number,
  trainType: string = 'Siemens Velaro YHT',
  carriageNumber: number = 1
): SeatItem[] {
  const seats: SeatItem[] = [];

  if (carriageNumber === 1) {
    // Business Class (2+1 layout, 8 rows)
    let seatNum = 1;
    for (let r = 1; r <= 8; r++) {
      // Left single seat (col 1)
      const isTaken1 = (seatNum * 3) % 4 === 0;
      seats.push({
        id: `train-c1-seat-${seatNum}`,
        number: seatNum,
        seatNumber: String(seatNum),
        row: r,
        col: 1,
        tier: 'business',
        type: 'business',
        status: isTaken1 ? 'booked' : 'empty',
        price: basePrice + 70,
        cabinClass: 'business',
        carriageNumber: 1,
        hasPowerSocket: true,
        facingDirection: r % 2 === 1 ? 'forward' : 'backward',
        label: `${trainType} - Vagon 1 - Koltuk ${seatNum} (Business Tekli)`,
      });
      seatNum++;

      // Right double seats (col 3 & 4)
      for (let c = 3; c <= 4; c++) {
        const isTaken2 = (seatNum * 5) % 3 === 0;
        seats.push({
          id: `train-c1-seat-${seatNum}`,
          number: seatNum,
          seatNumber: String(seatNum),
          row: r,
          col: c,
          tier: 'business',
          type: 'business',
          status: isTaken2 ? 'booked' : 'empty',
          price: basePrice + 70,
          cabinClass: 'business',
          carriageNumber: 1,
          hasPowerSocket: true,
          facingDirection: r % 2 === 1 ? 'forward' : 'backward',
          label: `${trainType} - Vagon 1 - Koltuk ${seatNum} (Business Çiftli)`,
        });
        seatNum++;
      }
    }
  } else if (carriageNumber === 4) {
    // 4-Seat Facing Table Clusters (Aile & Çalışma Masalı Vagon)
    let seatNum = 1;
    for (let r = 1; r <= 8; r++) {
      const isFacing = r % 2 === 1 ? 'forward' : 'backward';
      for (let c = 1; c <= 4; c++) {
        const isTaken = (seatNum * 7) % 5 === 0;
        seats.push({
          id: `train-c4-seat-${seatNum}`,
          number: seatNum,
          seatNumber: String(seatNum),
          row: r,
          col: c,
          tier: 'table',
          type: 'table',
          isTable: true,
          isTableSeat: true,
          status: isTaken ? 'booked' : 'empty',
          price: basePrice,
          cabinClass: 'economy',
          carriageNumber: 4,
          hasPowerSocket: true,
          facingDirection: isFacing,
          label: `${trainType} - Vagon 4 - Koltuk ${seatNum} (Masalı 4'lü Grup)`,
        });
        seatNum++;
      }
    }
  } else {
    // Standard Economy Carriage (2+2 layout, 10 rows)
    let seatNum = 1;
    for (let r = 1; r <= 10; r++) {
      const isFacing = r <= 5 ? 'forward' : 'backward';
      for (let c = 1; c <= 4; c++) {
        const isTaken = (seatNum * 4) % 5 === 0;
        const isWindow = c === 1 || c === 4;
        seats.push({
          id: `train-c${carriageNumber}-seat-${seatNum}`,
          number: seatNum,
          seatNumber: String(seatNum),
          row: r,
          col: c,
          tier: isWindow ? 'window' : 'aisle',
          type: isWindow ? 'window' : 'aisle',
          status: isTaken ? 'booked' : 'empty',
          price: basePrice,
          cabinClass: 'economy',
          carriageNumber,
          hasPowerSocket: true,
          facingDirection: isFacing,
          label: `${trainType} - Vagon ${carriageNumber} - Koltuk ${seatNum}`,
        });
        seatNum++;
      }
    }
  }

  return seats;
}

/**
 * Generates an authentic Ferry Salon / Deck Seat Layout (İDO / BUDO Fast Catamarans).
 * Features:
 * - Main Deck (Ana Güverte Salonu): 3+3 layout across 8 rows.
 * - Panoramic Upper Deck (Üst Panoramik Salon): Sea view VIP seats (+60 TL).
 */
export function generateFerrySeats(
  basePrice: number,
  deck: 'main' | 'upper' = 'main'
): SeatItem[] {
  const seats: SeatItem[] = [];
  let seatNum = 1;
  const isUpper = deck === 'upper';
  const totalRows = isUpper ? 6 : 9;

  for (let r = 1; r <= totalRows; r++) {
    // Left cluster: Col 1 (Window), Col 2, Col 3 (Aisle)
    for (let c = 1; c <= 3; c++) {
      const isTaken = (seatNum * 3 + r) % 4 === 0;
      const isWindow = c === 1;

      seats.push({
        id: `ferry-${deck}-seat-${seatNum}`,
        number: `${isUpper ? 'U' : 'M'}-${seatNum}`,
        seatNumber: `${isUpper ? 'U' : 'M'}-${seatNum}`,
        row: r,
        col: c,
        deck,
        tier: isUpper ? 'vip_lounge' : isWindow ? 'window' : 'standard',
        type: isUpper ? 'vip_lounge' : isWindow ? 'window' : 'standard',
        status: isTaken ? 'booked' : 'empty',
        price: isUpper ? basePrice + 60 : basePrice,
        label: `${isUpper ? 'Üst Güverte' : 'Ana Salon'} - Koltuk ${seatNum} (${isWindow ? 'Deniz Manzaralı' : 'Standart'})`,
      });
      seatNum++;
    }

    // Right cluster: Col 4 (Aisle), Col 5, Col 6 (Window)
    for (let c = 4; c <= 6; c++) {
      const isTaken = (seatNum * 5 + r) % 4 === 0;
      const isWindow = c === 6;

      seats.push({
        id: `ferry-${deck}-seat-${seatNum}`,
        number: `${isUpper ? 'U' : 'M'}-${seatNum}`,
        seatNumber: `${isUpper ? 'U' : 'M'}-${seatNum}`,
        row: r,
        col: c,
        deck,
        tier: isUpper ? 'vip_lounge' : isWindow ? 'window' : 'standard',
        type: isUpper ? 'vip_lounge' : isWindow ? 'window' : 'standard',
        status: isTaken ? 'booked' : 'empty',
        price: isUpper ? basePrice + 60 : basePrice,
        label: `${isUpper ? 'Üst Güverte' : 'Ana Salon'} - Koltuk ${seatNum} (${isWindow ? 'Deniz Manzaralı' : 'Standart'})`,
      });
      seatNum++;
    }
  }

  return seats;
}

/**
 * Unified Multi-Modal Cabin Seat Generator Helper.
 */
export function generateCabinSeats(
  mode: TransportMode | TransportType,
  layoutType: SeatLayoutType = 'bus_2_1',
  basePrice: number = 500
): SeatItem[] {
  const normMode = mode.toLowerCase();

  if (normMode === 'bus' || normMode === 'otobus') {
    return layoutType === 'bus_2_2' ? generateBus2Plus2Seats(basePrice) : generateBus2Plus1Seats(basePrice);
  }

  if (normMode === 'flight' || normMode === 'ucak') {
    return generateAirplaneSeats(basePrice);
  }

  if (normMode === 'train' || normMode === 'tren') {
    return generateTrainSeats(basePrice);
  }

  if (normMode === 'ferry' || normMode === 'feribot') {
    return generateFerrySeats(basePrice);
  }

  return generateBus2Plus1Seats(basePrice);
}

// Backward-compatible alias for existing components
export function generateBusSeats(basePrice: number): SeatItem[] {
  return generateBus2Plus1Seats(basePrice);
}

// ============================================================================
// SEED TICKETS REGISTRY FOR PNR LOOKUP & DIGITAL WALLET
// ============================================================================

export const SEED_TICKETS: BookingTicket[] = [
  {
    id: 'tkt-101',
    pnr: 'TK-4928',
    route: POPULAR_ROUTES[4], // THY Paris
    passengers: [
      {
        id: 'p-1',
        seatNumber: '1A',
        firstName: 'Emre',
        lastName: 'Yılmaz',
        idNumber: '10000000146',
        gender: 'male',
        email: 'emre.yilmaz@bileo.com',
        phone: '0532 555 12 34',
        luggageKg: 25,
        hasInsurance: true,
      },
    ],
    seats: ['1A'],
    basePrice: 2150,
    seatTierSurcharges: 350,
    luggageSurcharges: 95,
    insuranceFee: 45,
    discountAmount: 0,
    totalPrice: 2640,
    paymentMethod: 'credit_card',
    cardMasked: '•••• 4912',
    purchaseDate: '21 Mayıs 2026',
    purchaseTimestamp: 1779361200000,
    status: 'active',
    qrCodeValue: 'BILEO:TK-4928:1A:EMRE_YILMAZ',
  },
  {
    id: 'tkt-102',
    pnr: 'YHT-8192',
    route: POPULAR_ROUTES[6], // TCDD Ankara -> Konya
    passengers: [
      {
        id: 'p-2',
        seatNumber: '3',
        firstName: 'Selin',
        lastName: 'Demir',
        idNumber: '10000000146',
        gender: 'female',
        email: 'selin.demir@bileo.com',
        phone: '0544 321 98 76',
        luggageKg: 15,
        hasInsurance: false,
      },
    ],
    seats: ['3'],
    basePrice: 240,
    seatTierSurcharges: 70,
    luggageSurcharges: 0,
    insuranceFee: 0,
    discountAmount: 50,
    totalPrice: 260,
    promoCode: 'BILEO50',
    paymentMethod: 'fast',
    cardMasked: '•••• 7710',
    purchaseDate: '19 Mayıs 2026',
    purchaseTimestamp: 1779188400000,
    status: 'active',
    qrCodeValue: 'BILEO:YHT-8192:3:SELIN_DEMIR',
  },
  {
    id: 'tkt-103',
    pnr: 'PAM-7124',
    route: POPULAR_ROUTES[1], // Pamukkale İstanbul -> Ankara
    passengers: [
      {
        id: 'p-3',
        seatNumber: '7',
        firstName: 'Ahmet',
        lastName: 'Kaya',
        idNumber: '10000000146',
        gender: 'male',
        email: 'ahmet.kaya@bileo.com',
        phone: '0555 987 65 43',
        luggageKg: 20,
        hasInsurance: true,
      },
    ],
    seats: [7],
    basePrice: 600,
    seatTierSurcharges: 30,
    luggageSurcharges: 0,
    insuranceFee: 45,
    discountAmount: 0,
    totalPrice: 675,
    paymentMethod: 'credit_card',
    cardMasked: '•••• 8823',
    purchaseDate: '15 Mayıs 2026',
    purchaseTimestamp: 1778842800000,
    status: 'completed',
    qrCodeValue: 'BILEO:PAM-7124:7:AHMET_KAYA',
  },
  {
    id: 'tkt-104',
    pnr: 'IDO-3310',
    route: POPULAR_ROUTES[8], // İDO İstanbul -> Bursa
    passengers: [
      {
        id: 'p-4',
        seatNumber: 'U-12',
        firstName: 'Zeynep',
        lastName: 'Aydın',
        idNumber: '10000000146',
        gender: 'female',
        email: 'zeynep.aydin@bileo.com',
        phone: '0533 111 22 33',
        luggageKg: 15,
        hasInsurance: false,
      },
    ],
    seats: ['U-12'],
    basePrice: 290,
    seatTierSurcharges: 60,
    luggageSurcharges: 0,
    insuranceFee: 0,
    discountAmount: 0,
    totalPrice: 350,
    paymentMethod: 'credit_card',
    cardMasked: '•••• 3019',
    purchaseDate: '10 Mayıs 2026',
    purchaseTimestamp: 1778410800000,
    status: 'refunded',
    refundDetails: {
      refundedAmount: 350,
      refundDate: '11 Mayıs 2026',
      receiptId: 'REF-331092',
      reason: 'Kullanıcı talebiyle koşulsuz kesintisiz iade',
    },
    qrCodeValue: 'BILEO:IDO-3310:U-12:ZEYNEP_AYDIN',
  },
];
