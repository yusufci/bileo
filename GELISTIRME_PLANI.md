# Bileo geliştirme ve ilerletme planı (Turna veri entegrasyonu)

Tarih: 2026-09-06. Bu belge, Turna.com'dan **gerçekten çekilebilen** veriyi sekme sekme listeler, hangi alanların
dürüstçe gösterilebileceğini belirler ve web sitesini ilerletme adımlarını fazlara ayırır. Teknik uygulama sözleşmesi
[TURNA_INTEGRATION.md](TURNA_INTEGRATION.md) dosyasındadır; bu belge ürün ve yol haritası düzeyindedir.

## 1. Veri envanteri: Turna landing sayfalarından ne geliyor?

Kaynak yalnızca robots.txt'in izin verdiği landing sayfalarıdır. `turna.com/api/*` ve tarihli arama sayfaları kullanılmaz.
İki katman vardır: **JSON-LD** (schema.org, kararlı) ve sayfanın **RSC payload'u** (Next.js sunucu props'u; zengin ama
sürüm değişimine daha açık). RSC alanları "zenginleştirme" olarak ele alınır: yoksa arayüz sadece JSON-LD ile çalışır.

| Sekme | Sayfa | Çekilebilen alanlar | Çekilemeyen | Not |
|---|---|---|---|---|
| Uçak | `/ucak-bileti/{a}-{b}` | havayolu + IATA, kalkış/varış havalimanı ve kodu, ISO kalkış/varış, süre, fiyat TRY, 12 teklif (yaklaşan tarihlerde en ucuzlar); SSS: firma sayısı, en ucuz gün, haftalık/günlük sefer, havalimanları | belirli güne ait tam tarife, koltuk, aktarma bilgisi (`isDirect` bilinmiyor) | Havayolu logosu: `cdn.turna.com/Images/Flight/Airlines/{IATA}.png` (PC, TK doğrulandı) |
| Otobüs | `/otobus-bileti/{a}-{b}` | firma + firma sayfası, kalkış/varış terminali ve şehri, tarih-saat, süre, fiyat TRY, 6 sefer; SSS: firma sayısı, popüler firmalar, en ucuz gün | tam tarife, koltuk düzeni, boş koltuk | Firma logosu: `cdn.turna.com/Images/Bus/BusCompanies/{ascii-slug}.png` (nigde-inan-turizm, pamukkale-turizm, metro-turizm, varan-turizm doğrulandı; bazıları 403 verir, yedek: metin logosu) |
| Feribot | `/feribot-bileti/{a}-{b}` | SSS: en kısa süre, firma sayısı, firmalar | sefer listesi, fiyat | Yalnızca doğrulanmış duraklar: yalova, yenikapi, pendik |
| Otel | `/otel/{şehir}` | 50 otel: ad, slug/link, yıldız (0 = belirtilmemiş), puan (10 üzerinden) + puan metni, yorum sayısı, ilçe/şehir/bölge, olanaklar, etiketler (Denize Sıfır, Spa, Lüks…), çoklu fotoğraf (cdn.turna.com + travelapi) | **fiyat** (tarih seçimine bağlı), oda tipleri, müsaitlik | JSON-LD 20 otel + RSC `initialHotels` 50 otel; birleştirilir |
| Araç | `/arac-kiralama/sehir/{şehir}` | 25-35 araç: marka, model, sınıf (Economy/Standard/FullSize/Premium/Luxury), yakıt, vites, km limiti, araç görseli, kiralama firması + **firma logosu**, **günlük fiyat TRY** | tarih bazlı müsaitlik, teslim noktası, depozito | RSC `cars` dizisi; JSON-LD yalnızca `AutoRental` sayfa tanımı |
| Puan | yok | yok | her şey | Turna'da karşılığı yok; sekme kaldırılır veya "Bileo Puan" olarak ayrı ürün tasarlanır |

Dürüstlük kuralı: Turna'nın yayımlamadığı hiçbir alan (koltuk sayısı, puan, yorum, olanak, fiyat) uydurulmaz;
arayüz eksikliği açıkça yazar ("Fiyat için Turna'da tarih seçin").

**Koltuk durumu yayımlanmaz (2026-09-06 doğrulandı):** Uçak ve otobüs landing sayfalarının RSC payload'unda sefer başına
koltuk verisi yoktur; payload yalnızca `remainingSeatsLabel: "Son {count} koltuk"` ve `seatLegendAvailableTitle` gibi i18n
arayüz etiketlerini taşır, boş koltuk sayısı veya koltuk haritası geçmez. Bu veri sadece tarihli arama sayfalarında
(`/ucak-bileti/tek-yon/...` biçimi, robots.txt ile yasaklı) ve özel API'de üretilir; bu yüzden bileo koltuk planını temsili
gösterir ("Koltuk düzeni temsilidir; canlı doluluk Turna sayfasında yayımlanmaz") ve hiçbir yerde canlı doluluk iddiasında bulunmaz.

## 2. Fazlar

### Faz 1 (devam ediyor): Uçak, Otobüs, Feribot canlı veri + dürüst arayüz
Çalışan iş akışı: paylaşılan kütüphanenin bileo'ya taşınması (`src/lib/turna`, `src/server/turna`), tek `/api/turna`
ucu (Vite dev + Vercel aynı handler), robots/allowlist/rate-limit/önbellek, yerel otomatik tamamlama, sonuç ekranında
kaynak şeridi + tarih şeridi + fiyat özeti + rota bilgileri, tüketici ekranlarındaki sahte verinin temizlenmesi,
çevrimdışı testler. Bitiş kriteri: `npm test` yeşil (497 + yeni), `npm run build` temiz, dev sunucuda canlı arama.

### Faz 2: Otel ve Araç sekmeleri + marka görselleri
1. **TAMAMLANDI (2026-09-06):** Paylaşılan kütüphane (nexora-panel `lib/turna` + Python `turna/`): `kind: 'car'`, `CarOffer`,
   zengin `HotelOffer` (yıldız, olanaklar, etiketler, fotoğraflar, ilçe), RSC ayrıştırıcı (`initialHotels`, `cars`), logo URL
   türeticileri (`airlineLogoUrl`, `busCompanyLogoUrl`), `isAllowedLandingUrl`. Canlı doğrulama: İstanbul 35 araç (778-4.500 ₺/gün,
   12 firma, hepsinde araç görseli ve firma logosu), Antalya 50 otel (49'unda yıldız, 50'sinde etiket/olanak/fotoğraf), otobüs ve
   uçak satırlarında logo URL'si. Python testleri 40/40, panel smoke 16/16. Not: Turna CDN logoları sunucudan tarayıcı UA ister;
   tarayıcıdaki `<img>` sorunsuz yükler, `onError` yedeği zorunlu. Kaynak: `TransmissionManuel` (Türkçe yazım) -> `manual`,
   `VehicleClassMiniElite` -> `other`.
2. **TAMAMLANDI (2026-09-06):** bileo `/api/turna`: `kind=hotel&city=` ve `kind=car&city=` (aynı handler, aynı önbellek/limit
   politikası; `city ?? to ?? from`, şehir yoksa 400 `invalid_query`). Canlı doğrulama (dev sunucu http://127.0.0.1:5173 ve
   `scripts/turna_smoke.ts`, hem HTTP hem süreç içi modda aynı sayılar): `kind=car&city=istanbul` -> 35 araç, günlük fiyat
   min 778,34 / ortanca 1.672 / maks 4.500 TL, 12 firma, 35/35 araç görseli ve firma logosu, `routeKey: car:istanbul`;
   `kind=hotel&city=antalya` -> 50 otel (49'unda yıldız, 50/50 olanak veya etiket, 50/50 fotoğraf), `stats: null`;
   `kind=car` şehir olmadan -> 400 `invalid_query`; `kind=car&city=bodrum` -> 404 `route_not_found` (Turna'da böyle bir
   şehir sayfası yok). Çevrimdışı kanıt: `src/tests/turna_scraper.test.ts` grup K (22 test) ve fixture'lar `CAR_PAGE_HTML`,
   `HOTEL_PAGE_RSC_HTML`.
3. **TAMAMLANDI (2026-09-06):** Hero sekmeleri Otobüs, Uçak, Tren, Feribot, Otel, Araç (Puan sekmesi kaldırıldı); Otel ve Araç
   tek "Şehir" girişiyle çalışır (`searchPlacesForKind`, `popularCities`, `findCarCity`; Araç sekmesi yalnızca Turna'da sayfası
   olan şehirleri listeler), "Otel Ara" / "Araç Ara" düğmeleri, "Tarih ve fiyat seçimi Turna sayfasında yapılır." ipucu.
   Kanıt: `src/components/HeroSection.tsx`; test L.1 sekme etiketlerini ve metinleri sabitler.
4. **TAMAMLANDI (2026-09-06):** `src/components/results/HotelResults.tsx` ve `CarResults.tsx`; `SearchResults` şehir dalı
   ("Antalya otelleri" / "İstanbul araç kiralama" başlığı, "{n} otel|araç" sayacı, şehre özel açıklama, boş liste için
   "Turna bu şehir için liste yayımlamamış."). App: `searchKindToTurnaKind` eşlemesi, "N otel listelendi" / "N araç listelendi"
   bildirimleri (araçta en düşük günlük fiyat, otelde fiyatın tarihe bağlı olduğu notu). Otel kartında hiçbir fiyat yok, yıldız
   yalnızca belirtilmişse; araç kartında yalnızca Turna'nın günlük fiyatı. Kanıt: testler J.11, J.12, J.13, L.2, L.5, L.6, L.7.
   - **OtelSonuclari**: kart ızgarası; fotoğraf (lazy, referrerPolicy no-referrer, yedek renk bloğu), yıldızlar (0 ise gizle),
     puan/10 + puan metni + yorum sayısı, ilçe, olanak çipleri (en fazla 4), etiketler (en fazla 3), "Turna'da gör" bağlantısı.
     Fiyat alanı yerine tek cümle: "Fiyat tarih seçimine bağlıdır; Turna sayfasında görüntülenir."
     Sıralama: puan, yorum sayısı, yıldız. Filtre: yıldız, etiket, ilçe.
   - **AracSonuclari**: kart listesi; araç görseli, marka + model, sınıf/yakıt/vites/km çipleri, firma logosu (onError ile
     metin yedeği), **günlük fiyat**, "Turna'da kirala" bağlantısı. Fiyat özeti şeridi: en düşük/ortanca/en yüksek günlük,
     firma dağılımı. Filtre: sınıf, vites, yakıt, firma. Sıralama: fiyat, sınıf.
5. **TAMAMLANDI (2026-09-06):** `src/components/results/BrandLogo.tsx` üç adımlı zincir: önce bileo'nun SVG marka seti
   (`getNormalizedBrandName`), eşleşme yoksa Turna CDN logosu (`provenance.logoUrl`, `<img referrerPolicy="no-referrer">`,
   `onError` ile), o da yüklenmezse metin logosu. Kısa takma adlar (thy, klm, ba, vib, ido) artık yalnızca tam kelime eşleşir;
   "Seyidoğlu Turizm" İDO'ya, "Kathy Tours" THY'ye, "Vibe Tur" VİB'e dönmez. Kanıt: testler J.14, L.3, L.4.
6. **TAMAMLANDI (2026-09-06):** RSC fixture'ları (`rscScripts`, `CAR_PAGE_HTML`, `HOTEL_PAGE_RSC_HTML`, `SAMPLE_CAR_OFFERS`,
   `PHASE1_HOTEL_WIRE`) ve grup K (22 test) part 1'de; part 2'de grup J'ye Otel/Araç ekranlarının, logo zincirinin ve
   `ProvenanceStrip` sayacının SSR testleri (J.11'den J.15'e), yeni grup L (Faz 2 arayüz statik denetimleri, 8 test) eklendi ve
   I.7 `src/components/results` dosya listesini (10 dosya) yeniden sabitledi. `npm test`: 684 test, 684 geçti, 0 hata
   (Turna paketi 187 test, gruplar A'dan L'ye).

### Faz 3: Fiyat zekâsı ve takip
- Fiyat geçmişi: **KISMEN TAMAMLANDI (2026-09-06)**. Varsayılan bellek içi depo (`MemoryHistoryStore`, rota başına son 60 gerçek
  gözlem, kalıcı değil) ile ikinci taramadan itibaren uçak/otobüs/araç ekranında "HH:mm taramasına göre en düşük fiyat %x düştü/yükseldi"
  cümlesi (`PriceDeltaLine`, yalnızca gerçek gözlem varsa) ve `PriceHistoryStrip` ile son 5 fiyatlı gözlemin saat + en düşük fiyat
  zaman çizelgesi (yalnızca 2 ve üzeri gözlem varsa; birden fazla güne yayılırsa gün ön eki). Kalan: Postgres ile kalıcı geçmiş
  (sentetik geçmiş yok).
- Fiyat alarmı: **TAMAMLANDI, yerel sürüm (2026-09-06)**. `PriceAlertModal` artık e-posta istemez ve vaat etmez; hedef fiyat
  `src/lib/turna/alerts.ts` ile bu tarayıcıda (localStorage, rota başına tek alarm, en fazla 20) saklanır; her başarılı aramada
  `checkPriceAlerts` gerçek `stats.min` hedefin altına indiyse gözlem başına bir kez toast gösterir; açıklama metni ne yapmadığını
  söyler (e-posta/SMS yok). Kalan: sunucu tarafı (cron + webhook) ile e-posta, yalnızca gerçek gönderim altyapısı kurulunca.
- Zamanlanmış tarama: nexora-panel'deki zamanlayıcı ile popüler rotalar 10-30 dakikada bir taranır; bileo yalnızca
  önbellekten okur (Akamai yükü ve gecikme düşer).

### Faz 4: Ürünleştirme
- SEO landing sayfaları (rota başına statik sayfa: "İstanbul Ankara uçak bileti" verisiyle, kaynak atfı ile).
- PWA (çevrimdışı son arama, ana ekrana ekle), performans bütçesi (LCP < 2.5 s, CLS < 0.1), görsel optimizasyonu.
  **Kod bölme adımı TAMAMLANDI (2026-09-07):** Otel ve Araç sonuç panelleri `React.lazy` ile ayrı parçalara alındı
  (`HotelResults` 9,5 kB, `CarResults` 8,5 kB; ana paket 326 kB'den 310 kB'ye), Otel/Araç sekmesi seçilince
  `preloadCityResults` indirmeyi baştan başlatır; SSR testleri ikinci geçişte gerçek paneli doğrular.
- Erişilebilirlik denetimi (WCAG AA), klavye akışları, ekran okuyucu metinleri. **İlk tarama TAMAMLANDI (2026-09-07):**
  boş sayfa, uçak ve otel sonuçlarında adsız düğme/bağlantı 0, alt metni eksik görsel 0, etiketsiz form alanı 0, tekrarlayan id 0,
  pozitif tabindex 0; tek eksik olan sayfa düzeyi başlık (h1) Hero'ya ekran okuyucuya özel olarak eklendi. Klavye akışı ölçüldü (2026-09-07): öneri
  listesi ok tuşu/Enter/Escape doğru, sekme sırası mantıklı; fiyat alarmı modalı odak almıyor, Tab dışarı kaçıyor ve Escape
  kapatmıyordu, `src/lib/useDialogFocus.ts` ile düzeltildi (ilk odak, Tab döngüsü, Escape, açana geri dönüş). AuthModal ve PnrQueryModal da aynı
  kancayı kullanır (2026-09-07; role=dialog, aria-modal, adlandırılmış kapat düğmesi). Kontrast ölçüldü ve düzeltildi (2026-09-07):
  `charcoal.muted` #78726D krem-200 üzerinde 4,24:1 ile AA'yı geçemiyordu, #6B655F yapıldı (beyaz 5,75; krem-100 5,47; krem-200 5,14;
  krem-300 4,62; modal zemini 5,38); 11 px `text-charcoal-light` etiketleri muted'a alındı; L.11 testi oranları pinler.
  Tam ekran görünümler (bilet detayı, koltuk seçimi, ödeme) `useScreenEntry` ile girişte başlığa odaklanır, en üste kaydırır ve
  çıkışta odağı açan öğeye verir (2026-09-07). Koltuklar gerçek düğme: `aria-pressed`, durum taşıyan erişilebilir ad (boş / seçili, bayan / dolu, bay / tekli VIP)
  ve görünür odak halkası eklendi, `focus:outline-none` kaldırıldı (2026-09-07). Kalan: ok tuşlarıyla ızgara gezinmesi (isteğe bağlı).
- Gözlemlenebilirlik: **KISMEN TAMAMLANDI (2026-09-07)**. `src/server/turna/metrics.ts` süreç içi sayaçlar tutar (istek, başarı/hata,
  durum kodu, hata kodu, tür, fetchedVia, önbellek isabet oranı, son 200 isteğin p50/p95/max gecikmesi, son hata) ve
  `GET /api/turna?stats=1` bunları Turna'ya dokunmadan, önbelleksiz döndürür. Panel gösterimi TAMAMLANDI (2026-09-07): nexora-panel
  `GET /api/turna/bileo-stats` sunucu tarafında bileo sayaçlarını okur (`BILEO_API_BASE`), Turna sekmesindeki `BileoStatsCard`
  gösterir; erişilemezse dürüst "bileo erişilemedi" durumu. Akamai engelleri `blocked` hata kodu olarak zaten kırılımda görünür.
- Hukuki: kaynak atfı her ekranda, Turna marka kullanım sınırları, kullanım koşulları sayfası; ticari kullanım için Turna
  ile resmi veri ortaklığı görüşmesi.
- Dürüstlük taraması (2026-09-07): hava durumu modalı statik örnek veriyi canlı tahmin gibi sunuyordu; başlık "(örnek)",
  açık uyarı notu ve MGM bağlantısı eklendi, footer düğmesi "Hava Durumu (örnek)" oldu (L.14). Beş "canlı" rehber (sefer/GPS takibi, geçit ve tünel radarı, yol/hava radarı,
  doluluk radarı, uçuş radarı) paylaşılan `SampleDataNotice` ile işaretlendi, başlıklara "(örnek)" eklendi, "Canlı Sinyal", "ADS-B Canlı",
  "GDS envanterinden anlık çekilir" gibi iddialar kaldırıldı, footer etiketleri güncellendi (L.15, 2026-09-07). İkinci parti (L.16,
  2026-09-07): taksi tahmini, akıllı aktarma, durak çizelgesi, rota ağı haritası, mod karşılaştırma ve emanet dolapları modalları da
  "(örnek)" başlık + notice aldı; "Resmi tarife" ve "gerçek zamanlı optimize eder" iddiaları düzeltildi. Üçüncü parti (L.17, 2026-09-07): tarife matrisi,
  havalimanı metro, havalimanı servis/ekspres otobüs, servis saatleri, otoyol ücretleri ve şehir kartları modalları; "resmi güncel
  tarife ... baz alınmıştır" cümleleri temsili örnek uyarısıyla değiştirildi. Dördüncü parti (L.18, 2026-09-07): araç kiralama,
  hızlı kargo (bilinmeyen takip kodu için uydurma gönderi üretimi kaldırıldı), bütçe planlayıcı, gezi rehberi ve sigorta paketleri.
  Toplam 22 modal etiketli; TL veya saat içeren etiketsiz rehber kalmadı (Checkout, SeatSelection, TicketReschedule işlem akışıdır).

## 3. Kabul kriterleri (her faz için)
- Hiçbir sahte alan yok: `grep` denetimi + adaptör testleri (`availableSeats/rating/...` tanımsız kalır).
- Kaynak şeridi her sonuç ekranında: Turna.com bağlantısı, alınma saati (HH:mm), canlı/önbellek, uyarı sayısı.
- `npm test` 0 hata, `npm run build` temiz, `dist` içinde `node:crypto` yok.
- Dev sunucu ve Vercel'de aynı durum kodları ve başlıklar.
- Karanlık mod ve `prefers-reduced-motion` uyumu; tek vurgu rengi (bordo); em/en tire yok.

## 4. Riskler
- Akamai, Vercel çıkış IP'lerini engelleyebilir: dürüst 503 + `Retry-After`, önbellek ve kenar önbelleği; asla sahte yedek yok.
  Kalıcı engelde tek uyumlu yol resmi veri ortaklığı veya kendi barındırılan kazıyıcı (fastCRW `stealth`).
- RSC payload şekli değişebilir: RSC yalnızca zenginleştirme; JSON-LD yoksa "yapısal veri yok" uyarısı, sentetik satır yok.
- Logo URL kalıpları resmi değil: her görsel `onError` ile metin logosuna düşer.
- Otel fiyatı yok: kullanıcıya açıkça söylenir; fiyat iddiası yapılmaz.

## 5. Çok kaynaklı genişleme (2026-09-07, tamamlandı)
Turna verisinin yanına başka Türk landing sayfaları eklendi ve bu plan dışındaki ayrıntılar `KAYNAK_GENISLETME_PLANI.md`'de tutuldu:
obilet.com (otobüs microdata, uçak ve otel JSON-LD), biletall.com (otobüs, obilet ile aynı microdata), otelz.com (otel JSON-LD +
Next data, fiyatsız), enuygun.com (tarihli otobüs ve uçak, bölge id'li otel; yavaş host için 24/26 sn zaman aşımı ve 12 sn robots),
flixbus.com.tr (yalnızca rota bilgisi: başlangıç fiyatı, tipik süre, ilk/son kalkış; tarife yok). Ortak katman: host allowlist +
robots.txt, `GET /api/search` zarfı, her öğede `source`, `OtherSourcesPanel` kaynak rozetleri ve karşılaştırma cümlesi, otel puanı
eşleştirmesi (`hotelMatch`), `bySource` sayaçları ve gecikme yüzdelikleri (nexora-panel tablosu). TCDD, İDO, ucuzabilet, THY ve
yabancı toplayıcılar gerekçeleriyle reddedildi (KAYNAK planı bölüm 1 ve 5). Rehber modallarının 22'si "(örnek)" etiketi ve
`SampleDataNotice` ile işaretlendi; hızlı kargo ekranında uydurma takip sonucu üretimi kaldırıldı.
