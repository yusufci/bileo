import React from 'react';

export const getNormalizedBrandName = (name: string): string => {
  const n = (name || '').toLowerCase().trim();
  if (n.includes('türk hava yolları') || n.includes('turkish airlines') || n.includes('thy')) return 'Türk Hava Yolları';
  if (n.includes('pegasus')) return 'Pegasus';
  if (n.includes('ajet') || n.includes('anadolujet')) return 'AJet';
  if (n.includes('sunexpress')) return 'SunExpress';
  if (n.includes('lufthansa')) return 'Lufthansa';
  if (n.includes('emirates')) return 'Emirates';
  if (n.includes('qatar')) return 'Qatar Airways';
  if (n.includes('klm')) return 'KLM';
  if (n.includes('british') || n.includes('ba')) return 'British Airways';
  if (n.includes('air france') || n.includes('airfrance')) return 'Air France';
  if (n.includes('corendon')) return 'Corendon Airlines';
  if (n.includes('swiss')) return 'Swiss International';
  if (n.includes('austrian')) return 'Austrian Airlines';
  if (n.includes('kamil koç') || n.includes('kâmil koç')) return 'Kamil Koç';
  if (n.includes('pamukkale')) return 'Pamukkale Turizm';
  if (n.includes('varan')) return 'Varan Turizm';
  if (n.includes('metro')) return 'Metro Turizm';
  if (n.includes('ulusoy') || n.includes('ali osman')) return 'Ali Osman Ulusoy';
  if (n.includes('nilüfer') || n.includes('nilufer')) return 'Nilüfer Turizm';
  if (n.includes('süha') || n.includes('suha')) return 'Süha Turizm';
  if (n.includes('efe tur') || n.includes('efetur')) return 'Efe Tur';
  if (n.includes('uludağ') || n.includes('uludag')) return 'Balıkesir Uludağ';
  if (n.includes('astor')) return 'Astor Seyahat';
  if (n.includes('topçam') || n.includes('topcam')) return 'Topçam Turizm';
  if (n.includes('lük artvin') || n.includes('lüks artvin') || n.includes('luks artvin')) return 'Lüks Artvin';
  if (n.includes('fındıkkale') || n.includes('findikkale')) return 'Fındıkkale Turizm';
  if (n.includes('doğu ekspresi') || n.includes('dogu ekspresi')) return 'Doğu Ekspresi';
  if (n.includes('izban') || n.includes('i̇zban')) return 'İZBAN';
  if (n.includes('izdeniz') || n.includes('i̇zdeniz')) return 'İZDENİZ';
  if (n.includes('kale seyahat')) return 'Kale Seyahat';
  if (n.includes('dadaş') || n.includes('dadas')) return 'Dadaş Turizm';
  if (n.includes('ben turizm')) return 'Ben Turizm';
  if (n.includes('cizre')) return 'Cizre İtimat';
  if (n.includes('vib') || n.includes('vi̇b')) return 'Sakarya VİB';
  if (n.includes('kontur')) return 'Kontur Turizm';
  if (n.includes('özkaymak') || n.includes('ozkaymak')) return 'Özkaymak';
  if (n.includes('truva')) return 'Çanakkale Truva';
  if (n.includes('tcdd')) return 'TCDD Taşımacılık';
  if (n.includes('ido') || n.includes('i̇do')) return 'İDO';
  if (n.includes('budo')) return 'BUDO';
  if (n.includes('gestaş') || n.includes('gestas')) return 'Gestaş';
  if (n.includes('şehir hatları') || n.includes('sehir hatlari')) return 'Şehir Hatları';
  if (n.includes('marmaray')) return 'Marmaray';
  if (n.includes('başkentray') || n.includes('baskentray')) return 'Başkentray';
  if (n.includes('deutsche bahn') || n.includes('db ice')) return 'Deutsche Bahn ICE';
  if (n.includes('trenitalia') || n.includes('frecciarossa')) return 'Trenitalia Frecciarossa';
  return name;
};

// Real authentic vector SVG renderer with rich graphic emblems for all carriers
export const renderBrandSVG = (name: string) => {
  const normalized = getNormalizedBrandName(name);
  switch (normalized) {
    // ==========================================
    // 1. AVIATION / UÇAK FİRMALARI
    // ==========================================
    case 'Türk Hava Yolları':
    case 'Turkish Airlines':
      return (
        <svg viewBox="0 0 175 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#C8102E" />
          <path d="M9 18 C12 15 16 12 23 9 C20 14 17 18 13 22 C12 20 11 19 9 18 Z M17 16 C19 14 22 11 26 10 C24 14 21 17 19 19 Z" fill="#FFFFFF" />
          <text x="38" y="15" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="11" fill="#1E1B18" letterSpacing="0.5">TURKISH AIRLINES</text>
          <text x="38" y="26" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="7.5" fill="#C8102E" letterSpacing="1.5">TÜRK HAVA YOLLARI</text>
        </svg>
      );

    case 'Pegasus':
    case 'Pegasus Airlines':
      return (
        <svg viewBox="0 0 135 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 2)">
            <text x="0" y="18" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="19" fill="#E30613" letterSpacing="0.5">PEGASUS</text>
            <text x="1" y="27" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="7" fill="#FFB81C" letterSpacing="3">AIRLINES</text>
          </g>
        </svg>
      );

    case 'AJet':
    case 'AJET':
      return (
        <svg viewBox="0 0 105 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="24" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="24" fill="#002855" letterSpacing="-1">A</text>
          <text x="18" y="24" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="24" fill="#00A3E0" letterSpacing="-1">JET</text>
          <circle cx="92" cy="10" r="3" fill="#00A3E0" />
        </svg>
      );

    case 'SunExpress':
      return (
        <svg viewBox="0 0 150 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 5)">
            <circle cx="11" cy="11" r="5.5" fill="#FFCC00" />
            <path d="M11 0 L11 4 M11 18 L11 22 M0 11 L4 11 M18 11 L22 11 M3 3 L6 6 M16 16 L19 19 M3 19 L6 16 M16 6 L19 3" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round" />
          </g>
          <text x="29" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" fill="#002244" letterSpacing="-0.5">SunExpress</text>
        </svg>
      );

    case 'Lufthansa':
      return (
        <svg viewBox="0 0 145 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#05164D" />
          <circle cx="16" cy="16" r="12" fill="#FFAC00" />
          <path d="M10 21 C12 15 17 11 23 9 C19 12 17 16 14 20 Z" fill="#05164D" />
          <text x="38" y="21" fontFamily="Helvetica, Arial, sans-serif" fontWeight="800" fontSize="14" fill="#05164D" letterSpacing="0.5">Lufthansa</text>
        </svg>
      );

    case 'Emirates':
      return (
        <svg viewBox="0 0 135 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="4" width="32" height="24" rx="4" fill="#D71921" />
          <path d="M6 16 C10 9 22 9 26 16 C22 23 10 23 6 16 Z" fill="#FFFFFF" />
          <text x="38" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#D71921" letterSpacing="1">Emirates</text>
        </svg>
      );

    case 'Qatar Airways':
      return (
        <svg viewBox="0 0 165 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="15" cy="16" r="13" fill="#5C0632" />
          <text x="10" y="21" fontFamily="serif" fontWeight="900" fontSize="15" fill="#FFFFFF">Q</text>
          <text x="36" y="17" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="11" fill="#5C0632" letterSpacing="0.8">QATAR</text>
          <text x="36" y="26" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="7" fill="#777777" letterSpacing="2">AIRWAYS</text>
        </svg>
      );

    case 'KLM':
      return (
        <svg viewBox="0 0 105 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="9" r="2.5" fill="#00A1DE" />
          <circle cx="18" cy="7" r="3" fill="#00A1DE" />
          <circle cx="26" cy="9" r="2.5" fill="#00A1DE" />
          <path d="M6 15 L30 15 L27 11 L9 11 Z" fill="#00A1DE" />
          <text x="37" y="23" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" fill="#00A1DE" letterSpacing="1">KLM</text>
        </svg>
      );

    case 'British Airways':
      return (
        <svg viewBox="0 0 155 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="17" fontFamily="serif" fontWeight="800" fontSize="11" fill="#075AAA" letterSpacing="1">BRITISH AIRWAYS</text>
          <path d="M0 24 C40 24 80 30 145 24" stroke="#EB2226" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'Air France':
      return (
        <svg viewBox="0 0 145 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="21" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="14" fill="#002157" letterSpacing="1">AIRFRANCE</text>
          <path d="M104 19 L129 11 L124 23 Z" fill="#ED1622" />
        </svg>
      );

    // ==========================================
    // 2. INTERCITY BUS / OTOBÜS FİRMALARI
    // ==========================================
    case 'Kamil Koç':
      return (
        <svg viewBox="0 0 140 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="21" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="21" fill="#002B49" letterSpacing="-0.5">kâmil</text>
          <text x="62" y="21" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="21" fill="#E30613" letterSpacing="-0.5">KOÇ</text>
          <rect x="0" y="26" width="110" height="3" rx="1.5" fill="#E30613" />
        </svg>
      );

    case 'Pamukkale Turizm':
      return (
        <svg viewBox="0 0 160 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 3)">
            <path d="M10 0 C11 4 16 7 16 12 C16 18 11 22 7 22 C3 22 0 18 0 13 C0 8 5 5 7 0 C8 3 9 5 10 0 Z" fill="#E30613" />
            <path d="M7 7 C8 10 11 11 11 14 C11 17 8 19 5 19 C3 19 2 17 2 15 C2 12 5 10 7 7 Z" fill="#FFCC00" />
          </g>
          <text x="25" y="17" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#E30613" letterSpacing="0.8">PAMUKKALE</text>
          <text x="26" y="27" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="7" fill="#003399" letterSpacing="3">TURİZM</text>
        </svg>
      );

    case 'Varan Turizm':
      return (
        <svg viewBox="0 0 135 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="3" width="76" height="26" rx="5" fill="#8A222B" />
          <text x="38" y="21" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="13" fill="#FFD100" letterSpacing="2">VARAN</text>
          <text x="84" y="20" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="9.5" fill="#8A222B">TURİZM</text>
        </svg>
      );

    case 'Metro Turizm':
      return (
        <svg viewBox="0 0 135 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="3" width="72" height="26" rx="13" fill="#ED1C24" />
          <text x="36" y="21" textAnchor="middle" fontFamily="system-ui, sans-serif" fontStyle="italic" fontWeight="900" fontSize="14" fill="#FFFFFF">metro</text>
          <text x="80" y="20" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="9.5" fill="#ED1C24" letterSpacing="1">TURİZM</text>
        </svg>
      );

    case 'Ali Osman Ulusoy':
      return (
        <svg viewBox="0 0 150 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="13" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="8.5" fill="#003399" letterSpacing="1">ALİ OSMAN</text>
          <text x="0" y="27" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" fill="#C8102E" letterSpacing="0.5">ULUSOY</text>
        </svg>
      );

    case 'Nilüfer Turizm':
      return (
        <svg viewBox="0 0 135 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="16" r="10" fill="#00843D" />
          <path d="M7 16 C9 12 15 12 17 16 C15 20 9 20 7 16 Z" fill="#FFFFFF" />
          <text x="28" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#00843D" letterSpacing="-0.5">nilüfer</text>
        </svg>
      );

    case 'Süha Turizm':
      return (
        <svg viewBox="0 0 135 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="16" r="9" fill="#E65100" />
          <circle cx="12" cy="16" r="4" fill="#FFFFFF" />
          <text x="27" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="17" fill="#E65100" letterSpacing="0.5">SÜHA</text>
          <text x="80" y="20" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="7.5" fill="#555555">TURİZM</text>
        </svg>
      );

    case 'Efe Tur':
    case 'Efetur':
      return (
        <svg viewBox="0 0 125 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 3)">
            <circle cx="10" cy="12" r="9" fill="#002D62" />
            <path d="M6 12 L14 7 L14 17 Z" fill="#E30613" />
          </g>
          <text x="25" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="17" fill="#002D62">efe</text>
          <text x="56" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="17" fill="#E30613">tur</text>
        </svg>
      );

    case 'Balıkesir Uludağ':
      return (
        <svg viewBox="0 0 150 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 4)">
            <polygon points="10,0 18,18 2,18" fill="#00843D" />
            <polygon points="10,0 14,8 6,8" fill="#FFFFFF" />
          </g>
          <text x="24" y="14" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="8" fill="#00843D">BALIKESİR</text>
          <text x="24" y="27" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="13" fill="#003399">ULUDAĞ</text>
        </svg>
      );

    case 'Sakarya VİB':
    case 'Mersin VİB':
      return (
        <svg viewBox="0 0 135 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="4" width="22" height="24" rx="4" fill="#004D40" />
          <text x="11" y="21" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="12" fill="#FFFFFF">VIB</text>
          <text x="28" y="14" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="7" fill="#008080">SAKARYA</text>
          <text x="28" y="27" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="13" fill="#004D40">TURİZM</text>
        </svg>
      );

    case 'Kontur Turizm':
      return (
        <svg viewBox="0 0 130 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 4)">
            <circle cx="10" cy="11" r="9" fill="#00529B" />
            <path d="M5 11 L15 6 L12 16 Z" fill="#E30613" />
          </g>
          <text x="25" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" fill="#00529B">KONTUR</text>
        </svg>
      );

    case 'Özkaymak':
      return (
        <svg viewBox="0 0 135 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="16" r="9" fill="#800020" />
          <text x="7" y="21" fontFamily="serif" fontWeight="900" fontSize="13" fill="#FFD700">Ö</text>
          <text x="26" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#800020">ÖZKAYMAK</text>
        </svg>
      );

    case 'Çanakkale Truva':
      return (
        <svg viewBox="0 0 145 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 4)">
            <path d="M4 18 L6 8 L12 4 L14 8 L12 18 Z M6 18 L14 18" stroke="#0066B3" strokeWidth="2" fill="#002D62" />
          </g>
          <text x="22" y="14" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="7" fill="#002D62">ÇANAKKALE</text>
          <text x="22" y="27" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="13" fill="#0066B3">TRUVA</text>
        </svg>
      );

    // ==========================================
    // 3. RAIL & MARITIME / TREN & FERİBOT
    // ==========================================
    case 'TCDD Taşımacılık':
    case 'TCDD YHT':
      return (
        <svg viewBox="0 0 155 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 1)">
            <circle cx="10" cy="14" r="7" fill="#003399" />
            <circle cx="10" cy="14" r="4" fill="#FFFFFF" />
            <circle cx="10" cy="14" r="2" fill="#C8102E" />
            <path d="M0 14L6 10L5 14L6 18Z" fill="#003399" />
            <path d="M20 14L14 10L15 14L14 18Z" fill="#003399" />
          </g>
          <text x="26" y="16" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="12" fill="#003399">TCDD</text>
          <text x="64" y="16" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="12" fill="#C8102E">YHT</text>
          <text x="26" y="26" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="6.5" fill="#555555" letterSpacing="1">TAŞIMACILIK A.Ş.</text>
        </svg>
      );

    case 'İDO':
    case 'İDO (İstanbul Deniz Otobüsleri)':
      return (
        <svg viewBox="0 0 115 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="20" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="19" fill="#0066B3">İDO</text>
          <path d="M38 15 C44 9 50 21 58 15" stroke="#FF8200" strokeWidth="3" fill="none" strokeLinecap="round" />
          <text x="0" y="29" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="5.5" fill="#0066B3" letterSpacing="1.2">DENİZ OTOBÜSLERİ</text>
        </svg>
      );

    case 'BUDO':
    case 'BUDO Express':
      return (
        <svg viewBox="0 0 125 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="20" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" fill="#009639">BUDO</text>
          <path d="M50 15 C56 10 62 20 70 15" stroke="#0066B3" strokeWidth="3" fill="none" strokeLinecap="round" />
          <text x="0" y="29" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="5.5" fill="#009639" letterSpacing="1">BURSA DENİZ</text>
        </svg>
      );

    case 'Gestaş':
    case 'GESTAŞ':
      return (
        <svg viewBox="0 0 115 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="21" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" fill="#004280" letterSpacing="1">GESTAŞ</text>
          <path d="M0 27 C20 24 40 30 60 27" stroke="#C8102E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'Şehir Hatları':
      return (
        <svg viewBox="0 0 140 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 4)">
            <circle cx="10" cy="11" r="8" fill="#007799" />
            <path d="M5 11 C8 8 12 14 15 11" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
          <text x="24" y="16" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="10" fill="#007799" letterSpacing="1">ŞEHİR HATLARI</text>
          <path d="M24 23 C50 20 75 25 105 22" stroke="#00A8B5" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'Marmaray':
      return (
        <svg viewBox="0 0 125 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="16" r="9" fill="#005B94" />
          <path d="M6 16 H16 M11 11 V21" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <text x="26" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#005B94" letterSpacing="1">MARMARAY</text>
        </svg>
      );

    case 'Başkentray':
      return (
        <svg viewBox="0 0 130 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="6" width="20" height="20" rx="4" fill="#003366" />
          <path d="M5 16 L15 11 L15 21 Z" fill="#C8102E" />
          <text x="26" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="14" fill="#003366" letterSpacing="0.8">BAŞKENTRAY</text>
        </svg>
      );

    case 'Deutsche Bahn ICE':
      return (
        <svg viewBox="0 0 105 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="5" width="32" height="22" rx="4" fill="#EE1B24" />
          <text x="16" y="21" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="13" fill="#FFFFFF">DB</text>
          <text x="40" y="21" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="14" fill="#EE1B24">ICE</text>
        </svg>
      );

    case 'Trenitalia Frecciarossa':
      return (
        <svg viewBox="0 0 140 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="14" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="7.5" fill="#006644">TRENITALIA</text>
          <text x="0" y="26" fontFamily="system-ui, sans-serif" fontStyle="italic" fontWeight="900" fontSize="11" fill="#C8102E">FRECCIAROSSA</text>
        </svg>
      );

    // ==========================================
    // 4. DISTINCT FOOTER REGIONAL & EXPRESS CARRIERS
    // ==========================================
    case 'Astor Seyahat':
      return (
        <svg viewBox="0 0 145 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="16" r="10" fill="#1C3F94" />
          <polygon points="12,8 14,13 19,13 15,16 17,21 12,18 7,21 9,16 5,13 10,13" fill="#FFD700" />
          <text x="28" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="17" fill="#1C3F94" letterSpacing="0.8">ASTOR</text>
          <text x="88" y="21" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="7.5" fill="#E30613">SEYAHAT</text>
        </svg>
      );

    case 'Topçam Turizm':
      return (
        <svg viewBox="0 0 145 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 4)">
            <polygon points="10,0 18,18 2,18" fill="#006837" />
            <polygon points="10,4 15,15 5,15" fill="#FFFFFF" />
          </g>
          <text x="24" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" fill="#006837" letterSpacing="0.5">TOPÇAM</text>
          <text x="88" y="21" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="7.5" fill="#555555">TURİZM</text>
        </svg>
      );

    case 'Corendon Airlines':
      return (
        <svg viewBox="0 0 160 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 16 C12 8 20 8 24 16 C18 24 10 24 6 16 Z" fill="#EE2737" />
          <text x="28" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" fill="#EE2737" letterSpacing="-0.5">corendon</text>
          <text x="100" y="21" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="7.5" fill="#555555">AIRLINES</text>
        </svg>
      );

    case 'Lüks Artvin':
      return (
        <svg viewBox="0 0 140 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="4" width="22" height="24" rx="4" fill="#004D40" />
          <path d="M4 16 L18 8 L18 24 Z" fill="#80CBC4" />
          <text x="28" y="14" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="7" fill="#008080">LÜKS</text>
          <text x="28" y="27" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="13" fill="#004D40">ARTVİN</text>
        </svg>
      );

    case 'Fındıkkale Turizm':
      return (
        <svg viewBox="0 0 155 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="16" r="9" fill="#006837" />
          <circle cx="11" cy="16" r="5" fill="#FFCC00" />
          <text x="26" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="14" fill="#006837" letterSpacing="0.5">FINDIKKALE</text>
        </svg>
      );

    case 'Swiss International':
      return (
        <svg viewBox="0 0 135 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="6" width="20" height="20" rx="3" fill="#D80032" />
          <path d="M8 11 H12 V21 H8 Z M5 14 H15 V18 H5 Z" fill="#FFFFFF" />
          <text x="28" y="21" fontFamily="Helvetica, Arial, sans-serif" fontWeight="900" fontSize="15" fill="#D80032" letterSpacing="0.5">SWISS</text>
        </svg>
      );

    case 'Austrian Airlines':
      return (
        <svg viewBox="0 0 150 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="17" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="12" fill="#D80032" letterSpacing="1">Austrian</text>
          <polygon points="62,12 80,6 76,18" fill="#D80032" />
        </svg>
      );

    case 'Doğu Ekspresi':
      return (
        <svg viewBox="0 0 145 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 4)">
            <rect x="0" y="0" width="20" height="18" rx="3" fill="#8A222B" />
            <circle cx="10" cy="9" r="4" fill="#FFD700" />
          </g>
          <text x="26" y="21" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="13" fill="#8A222B" letterSpacing="1">DOĞU EKSPRESİ</text>
        </svg>
      );

    case 'İZBAN':
      return (
        <svg viewBox="0 0 120 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="16" r="9" fill="#003366" />
          <path d="M6 16 L16 11 L16 21 Z" fill="#00A1DE" />
          <text x="27" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" fill="#003366" letterSpacing="0.5">İZBAN</text>
        </svg>
      );

    case 'İZDENİZ':
      return (
        <svg viewBox="0 0 130 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 4)">
            <circle cx="11" cy="11" r="9" fill="#007799" />
            <path d="M5 11 C8 7 14 15 17 11" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
          <text x="27" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" fill="#007799" letterSpacing="0.5">İZDENİZ</text>
        </svg>
      );

    case 'Kale Seyahat':
      return (
        <svg viewBox="0 0 140 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 4)">
            <rect x="0" y="4" width="18" height="14" fill="#003399" />
            <rect x="2" y="0" width="4" height="4" fill="#003399" />
            <rect x="12" y="0" width="4" height="4" fill="#003399" />
          </g>
          <text x="24" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#003399" letterSpacing="0.8">KALE SEYAHAT</text>
        </svg>
      );

    case 'Dadaş Turizm':
      return (
        <svg viewBox="0 0 140 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 4)">
            <circle cx="10" cy="11" r="9" fill="#1C3F94" />
            <path d="M4 11 L10 5 L16 11 L10 17 Z" fill="#FFD700" />
          </g>
          <text x="25" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#1C3F94">DADAŞ TURİZM</text>
        </svg>
      );

    case 'Ben Turizm':
      return (
        <svg viewBox="0 0 130 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="16" r="9" fill="#E30613" />
          <text x="7" y="21" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="14" fill="#FFFFFF">B</text>
          <text x="27" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" fill="#E30613">BEN TURİZM</text>
        </svg>
      );

    case 'Cizre İtimat':
      return (
        <svg viewBox="0 0 145 32" className="h-7 w-auto" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0, 4)">
            <polygon points="10,0 19,10 10,20 1,10" fill="#800020" />
            <circle cx="10" cy="10" r="3" fill="#FFD700" />
          </g>
          <text x="25" y="22" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#800020">CİZRE İTİMAT</text>
        </svg>
      );

    default:
      return (
        <span className="text-sm font-extrabold text-[#1E1B18] tracking-tight">
          {name}
        </span>
      );
  }
};

// Aviation / Uçak Logoları (Top Header Ribbon)
export const AVIATION_BRANDS = [
  'Türk Hava Yolları',
  'Pegasus',
  'SunExpress',
  'AJet',
  'Lufthansa',
  'Emirates',
  'Qatar Airways',
  'KLM',
  'British Airways',
  'Air France',
];

// Intercity Bus / Otobüs Logoları (Middle Ribbon)
export const BUS_BRANDS = [
  'Kamil Koç',
  'Pamukkale Turizm',
  'Varan Turizm',
  'Metro Turizm',
  'Ali Osman Ulusoy',
  'Nilüfer Turizm',
  'Süha Turizm',
  'Efe Tur',
  'Balıkesir Uludağ',
  'Kontur Turizm',
  'Özkaymak',
  'Sakarya VİB',
  'Çanakkale Truva',
];

// Rail & Maritime / Tren & Feribot Logoları (Sub-Middle Ribbon)
export const RAIL_FERRY_BRANDS = [
  'TCDD Taşımacılık',
  'İDO',
  'BUDO',
  'Gestaş',
  'Şehir Hatları',
  'Marmaray',
  'Başkentray',
  'Deutsche Bahn ICE',
  'Trenitalia Frecciarossa',
];

// Distinct Regional & Express Carriers (Footer Ribbon)
export const FOOTER_DISTINCT_BRANDS = [
  'Astor Seyahat',
  'Topçam Turizm',
  'Corendon Airlines',
  'Lüks Artvin',
  'Fındıkkale Turizm',
  'Swiss International',
  'Doğu Ekspresi',
  'Austrian Airlines',
  'İZBAN',
  'Kale Seyahat',
  'İZDENİZ',
  'Dadaş Turizm',
  'Ben Turizm',
  'Cizre İtimat',
];

// ==========================================
// 1. TOP AVIATION RIBBON (Üst Uçak Şeridi)
// ==========================================
export const AviationLogosRibbon: React.FC<{ onSelectCarrier?: (brand: string) => void }> = ({
  onSelectCarrier,
}) => {
  return (
    <div className="w-full overflow-hidden relative select-none py-3 opacity-90 hover:opacity-100 transition-opacity">
      {/* Left/Right Edge Fades */}
      <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#FBF9F5] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#FBF9F5] to-transparent z-10 pointer-events-none" />

      <div className="flex overflow-hidden">
        <div className="animate-marquee-left flex items-center gap-12 sm:gap-16">
          {[...AVIATION_BRANDS, ...AVIATION_BRANDS].map((brand, idx) => (
            <div
              key={`air-${idx}`}
              onClick={() => onSelectCarrier && onSelectCarrier(brand)}
              className="flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200"
              title={`${brand} Seferlerini İncele`}
            >
              {renderBrandSVG(brand)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. BUS RIBBON (Otobüs Firmaları Şeridi)
// ==========================================
export const BusLogosRibbon: React.FC<{ onSelectCarrier?: (brand: string) => void }> = ({
  onSelectCarrier,
}) => {
  return (
    <div className="w-full overflow-hidden relative select-none py-3">
      {/* Left/Right Edge Fades */}
      <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#FBF9F5] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#FBF9F5] to-transparent z-10 pointer-events-none" />

      <div className="flex overflow-hidden">
        <div className="animate-marquee-left flex items-center gap-12 sm:gap-16">
          {[...BUS_BRANDS, ...BUS_BRANDS].map((brand, idx) => (
            <div
              key={`bus-${idx}`}
              onClick={() => onSelectCarrier && onSelectCarrier(brand)}
              className="flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200"
              title={`${brand} Seferlerini İncele`}
            >
              {renderBrandSVG(brand)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. RAIL & MARITIME RIBBON (Tren & Feribot Şeridi)
// ==========================================
export const RailFerryLogosRibbon: React.FC<{ onSelectCarrier?: (brand: string) => void }> = ({
  onSelectCarrier,
}) => {
  return (
    <div className="w-full overflow-hidden relative select-none py-3">
      {/* Left/Right Edge Fades */}
      <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#FBF9F5] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#FBF9F5] to-transparent z-10 pointer-events-none" />

      <div className="flex overflow-hidden">
        <div className="animate-marquee-right flex items-center gap-12 sm:gap-16">
          {[...RAIL_FERRY_BRANDS, ...RAIL_FERRY_BRANDS].map((brand, idx) => (
            <div
              key={`rf-${idx}`}
              onClick={() => onSelectCarrier && onSelectCarrier(brand)}
              className="flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200"
              title={`${brand} Seferlerini İncele`}
            >
              {renderBrandSVG(brand)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. FOOTER DISTINCT RIBBON (Footer Üstü Ayrı Firmalar Şeridi)
// ==========================================
export const FooterPartnerRibbon: React.FC<{ onSelectCarrier?: (brand: string) => void }> = ({
  onSelectCarrier,
}) => {
  return (
    <div className="w-full overflow-hidden relative select-none py-6">
      {/* Left/Right Edge Fades */}
      <div className="absolute top-0 bottom-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#FBF9F5] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#FBF9F5] to-transparent z-10 pointer-events-none" />

      <div className="flex overflow-hidden">
        <div className="animate-marquee-left flex items-center gap-12 sm:gap-16">
          {[...FOOTER_DISTINCT_BRANDS, ...FOOTER_DISTINCT_BRANDS].map((brand, idx) => (
            <div
              key={`foot-${idx}`}
              onClick={() => onSelectCarrier && onSelectCarrier(brand)}
              className="flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200"
              title={`${brand} Seferlerini İncele`}
            >
              {renderBrandSVG(brand)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Legacy compatibility export
export const PartnerLogosRibbon: React.FC<{ onSelectCarrier?: (brand: string) => void }> = ({
  onSelectCarrier,
}) => {
  return (
    <section className="py-2 overflow-hidden relative select-none">
      <BusLogosRibbon onSelectCarrier={onSelectCarrier} />
      <RailFerryLogosRibbon onSelectCarrier={onSelectCarrier} />
    </section>
  );
};
