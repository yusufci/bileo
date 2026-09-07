# Kaynak genişletme planı: Turna dışındaki bilet ve seyahat siteleri

Tarih: 2026-09-07. Bu belge, bileo'nun veri kaynağını Turna.com'un ötesine taşımak için yapılan **canlı keşfin** sonuçlarını ve
2 dakikalık geliştirme turlarına bölünmüş yol haritasını içerir. Turna tarafındaki sözleşme ve kurallar
[TURNA_INTEGRATION.md](TURNA_INTEGRATION.md) ve [GELISTIRME_PLANI.md](GELISTIRME_PLANI.md) dosyalarında; bu belge yalnızca yeni
kaynakları kapsar. Keşif artefaktları: `C:\Users\cayma\AppData\Local\Temp\turna_probe\sources\*.html|*.jsonld.json`.

## 0. Değişmeyen ilkeler

1. **Yalnızca robots.txt'in izin verdiği, tarihsiz landing sayfaları.** Arama sonuç sayfaları, `?date=` gibi tarihli sorgular,
   `/api/`, `/json/`, `/ajax/` uçları asla çekilmez. Her kaynak için host bazlı allowlist ve robots kontrolü sunucuda zorunludur.
2. **Uydurma veri yok.** Sayfa neyi yayımlıyorsa o gösterilir; koltuk doluluğu, tarih bazlı müsaitlik gibi yayımlanmayan alanlar boş
   kalır ve arayüz eksikliği söyler.
3. **Kaynak atfı her satırda.** Her teklif `source` taşır (`turna`, `obilet`, `biletall`, `otelz`); kart üzerinde kaynak rozeti,
   şeritte kaynak sayfa bağlantısı ve alınma saati gösterilir. Karşılaştırma ekranı "hangi kaynak daha ucuz" derken ikisini de
   aynı saat damgasıyla gösterir.
4. **Nazik tarama.** Host başına en az 1,2 sn aralık, 10 dakika sunucu önbelleği, 60 sn yenileme sınırı, Akamai/Cloudflare
   engelinde 5 dk soğuma, geliştirme turu başına en fazla 2 canlı istek (tüm hostlar toplam).
5. **Hukuki not.** robots.txt izni kullanım koşulu izni değildir. Landing sayfalarındaki yapısal veri (JSON-LD, microdata) arama
   motorları için yayımlanır; bileo bunu kaynak atfıyla ve sayfaya bağlantı vererek gösterir, veriyi yeniden satmaz. Ticari
   kullanım için her kaynakla resmi veri/affiliate anlaşması gerekir; bu belge bunu şart olarak kaydeder.

## 1. Keşif sonuçları (2026-09-07, canlı ölçüm)

| Site | robots.txt (landing) | Engel | Veri katmanı | Alanlar | Karar |
|---|---|---|---|---|---|
| **obilet.com** otobüs `/otobus-bileti/{a}-{b}` | İzinli | Yok, 134 ms | **schema.org microdata**: `itemtype=BusTrip`, `itemprop=provider/departureTime/arrivalTime/price`, 30 sefer | firma, kalkış/varış saati, fiyat TRY; başlıkta "560 TL'den başlayan" | **Faz A1** |
| **obilet.com** uçak `/ucak-bileti/{a}-{b}` | İzinli | Yok | **JSON-LD** `Flight` x10 (`departureAirport{iataCode,geo}`, `arrivalAirport`, `departureTime "14:40"`, `arrivalTime`, `provider Airline{iataCode}`, `offers[{price,priceCurrency}]`, `estimatedFlightDuration "1sa 0dk"`), `AggregateOffer.lowPrice` | Turna ile aynı şekil; tarih yok (yalnızca saat) | **Faz A2** |
| **obilet.com** otel `/otel/{şehir}-otelleri` | İzinli | Yok | **JSON-LD** `ItemList` + `Hotel` x10 (`starRating.ratingValue`, `aggregateRating{ratingValue/10, reviewCount}`, `geo`, `address`, `image`, `description`, `url`, `LocationFeatureSpecification` x6/otel), `FAQPage` | yıldız, puan, yorum sayısı, konum, olanaklar; **fiyat yok** | **Faz A3** |
| **obilet.com** araç `/arac-kiralama/{şehir}` | İzinli | Yok | Yalnızca Breadcrumb/WebSite JSON-LD; araç listesi istemci tarafı | yok | Reddet (veri yok) |
| **biletall.com** otobüs | İzinli (obilet ile aynı robots) | Yok | obilet ile **aynı microdata** (aynı altyapı; meta açıklaması bile "obilet.com'da" diyor) | obilet ile aynı | **Faz A6** (aynı parser, ikinci host) |
| **otelz.com** otel `/{şehir}-otelleri` | İzinli | Yok | **JSON-LD** `Hotel` x20 (`aggregateRating`, `address`, `url`, `image`, `priceRange` metin) + `__NEXT_DATA__.props.pageProps.data.facilities` (20 otel: `netPrice`, `score`, `likes`, `lat/lng`, `hasFreeCancellation`) | puan, yorum, konum, **landing fiyatı** (`netPrice`, varsayılan tarih; "tarihe bağlı" etiketiyle) | **Faz B1** |
| **enuygun.com** otobüs `/otobus-bileti/{a}-{b}/` (sondaki eğik çizgi zorunlu) | İzinli | Yok ama yavaş: 12,4 sn, 842 KB | **JSON-LD** `BusTrip` x40 (`departureBusStop{name}`, `arrivalBusStop`, **ISO tarih-saat** `2026-09-08T11:29:00`, `provider Organization{name}`, `offers{price 500, priceCurrency TRY}`), `Product` + `AggregateOffer`, `FAQPage` | firma, durak, tarihli kalkış/varış, fiyat TRY (Turna'dan zengin: tarih var) | **Faz D3** adaptör (host politikası: 30 sn deneme zaman aşımı) |
| **enuygun.com** uçak `/ucak-bileti/{a}-{b}-{kodA}-{kodB}/` (13 şehir kodu tablosu: ista, anka, izma, ayta, adaa, diya, gzta, htya, tzxa, asra, mlxa, vasa, vana) | İzinli | Yok, 12,5 sn, 861 KB | **JSON-LD** `Flight` x18 (`departureTime` ISO +03:00 tarihli, `estimatedFlightDuration` "PT1H", havalimanı IATA + ad + geo, `provider Airline{iataCode}`, `offers[{price 1487, TRY}]`), `Product/AggregateOffer` lowPrice 1478 offerCount 34, `FAQPage` | havayolu, tarihli kalkış, havalimanları, fiyat | **Faz D6** adaptör (yalnızca kod tablosundaki 13 şehir) |
| **enuygun.com** otel `/otel/bolge/{şehir}-{id}/` (20 bölge id tablosu: antalya 481, istanbul 1639, izmir 1665, ankara 386, bodrum 745, alanya 4671, cesme 4275, kusadasi 4227, marmaris 4302, fethiye, kapadokya, ...) | İzinli | Yok, 12,5 sn, 1 MB | **JSON-LD** `ItemList` + `Hotel` x20 (`aggregateRating{ratingValue "9.2", reviewCount, bestRating 10}`, `address{addressLocality, addressRegion}`, image, url, description); yıldız yok, fiyat yok | puan, yorum, ilçe | **Faz D7** adaptör (yalnızca id tablosundaki bölgeler) |
| ucuzabilet.com | İzinli | **Cloudflare challenge (403)** | Erişilemez | | Reddet |
| turkishairlines.com rota sayfası | İzinli | 404 (kalıp yanlış) | | | Reddet (havayolu siteleri kapsam dışı) |
| **flixbus.com.tr** rota `/otobus-seferleri/{a}-{b}` (sitemap `network/0`: 24.014 rota) | İzinli | Yok ama yavaş (12,3 sn), 166 KB | **JSON-LD** `Product` + `AggregateOffer{lowPrice "999", offerCount 10, TRY}`, `BusTrip` x2 (yalnızca rota adı, durak listesi ve `GeoCoordinates`; saat yok), `FAQPage` (fiyat başlangıcı, süre, ilk/son kalkış, durak sayısı) | rota düzeyi en düşük fiyat ve rota bilgileri; **tarife yok** | **Faz D5** (isteğe bağlı, düşük öncelik: rota bilgisi + karşılaştırma satırına "flixbus.com.tr 999 TL") |
| tcddtasimacilik.gov.tr | **Belirsiz**: robots.txt ve sitemap.xml istekleri 30 KB Angular kabuğunu döndürüyor (catch-all yönlendirme), yani robots kuralı yok | Yok, ancak içerik yok | Angular SPA (`app-root`, `runtime.*.js`); veri `api.tcddtasimacilik.gov.tr/api/` ve `baskentrayapi` özel API'lerinden geliyor; sunucu tarafı tarife sayfası veya bağlantı yok | yok | **Reddedildi (C1, 2026-09-07)**: özel API kural gereği kapsam dışı; Tren sekmesi resmi veri anlaşması olmadan kapalı kalır |
| ido.com.tr | İzinli | 2 KB SPA kabuğu | İstemci tarafı | | Reddet (API gerekir) |
| kamilkoc.com.tr, metroturizm.com.tr | Operatör siteleri | flixbus'a yönlendirme / SPA | | | Reddet |
| skyscanner, trip.com | İzinli görünüyor | Yabancı toplayıcılar, ağır bot koruması | | | Kapsam dışı |

Özet: **obilet (otobüs, uçak, otel) + biletall (otobüs) + otelz (otel)** hemen entegre edilebilir; hepsi Turna ile aynı iki katmanı
(JSON-LD / microdata / RSC-Next data) kullanıyor, ek bağımlılık gerekmez.

## 2. Mimari: çok kaynaklı arama

- `src/lib/sources/types.ts`: `SourceId = 'turna' | 'obilet' | 'biletall' | 'otelz'`; teklif tiplerine `source: SourceId` alanı
  (Turna tipleri değişmez, `TurnaOffer` bir `SourceOffer` alt kümesi olur); `SearchEnvelope = { kind, query, sources: Record<SourceId,
  TurnaSuccess | TurnaFailure>, merged: MergedOffer[], comparison: { cheapestBySource: Record<SourceId, number | null> } }`.
- `src/server/sources/{registry,obilet,biletall,otelz}.ts`: her kaynak `SourceAdapter { id, kinds, resolveTarget(query), isAllowedUrl,
  parse(html) }`; **fetch katmanı tek**: mevcut `src/server/turna/fetch.ts` host bazlı yapılandırmayla genelleştirilir (allowlist,
  robots önbelleği, hız sınırı, negatif önbellek, engel soğuması hepsi host başına). obilet/biletall microdata için küçük bir
  `parseMicrodata(html, itemtype)` yardımcı (regex + itemprop toplama, DOM kütüphanesi yok).
- `GET /api/search?kind=bus&from=istanbul&to=ankara&sources=turna,obilet`: kaynaklar paralel (Promise.allSettled), her biri kendi
  hata koduyla; `merged` firmaya + kalkış saatine göre birleştirir, aynı sefer iki kaynakta varsa iki fiyatı da taşır. Var olan
  `/api/turna` aynen kalır (geriye uyumluluk, testler).
- UI: kartta kaynak rozeti (`SourceBadge`), `ProvenanceStrip` çoklu kaynak (her kaynak için bağlantı ve saat), sonuç başlığında
  "2 kaynak, en ucuz: obilet 560 TL / Turna 500 TL" karşılaştırma satırı (yalnızca her iki kaynak başarılıysa), filtrede kaynak
  seçimi. Otel ekranında otelz `netPrice` "landing fiyatı, tarihe bağlı" etiketiyle; Turna/obilet otelleri fiyatsız kalır.
- Fiyat geçmişi ve alarm: `routeKey` kaynak ön ekiyle (`obilet:bus:istanbul-ankara`), sayaçlar kaynak kırılımıyla (`byKind` yanına
  `bySource`).
- Python `turna/` ve nexora-panel: sözleşmeye `source` alanı eklenir (parite testi zorlar); panel Turna sekmesi kaynak seçici alır.

## 3. Fazlar ve turlar (her tur tek adım, 2 dakikaya sığar; adım bitmezse "devam ediyor" yazılır)

### Faz A: obilet (otobüs, uçak, otel) ve biletall
- [x] **A1** (2026-09-07) `src/server/sources/microdata.ts` + `obilet.ts` (`parseBusTrips`, `titleMinPrice`, `busLandingUrl`), `src/lib/sources/types.ts` (`SourceId`, `SourceBusTrip`), fixture `sources_fixtures.ts`, testler S.1-S.3 ve O.1-O.5. Orijinal tanım: `parseMicrodata` + `obilet` otobüs ayrıştırıcı (fixture: `sources/obilet_bus.html` kısaltılmış kopyası): firma, kalkış/varış
      saati, fiyat; `stableId`; testler (K/M grubu). Yalnızca çevrimdışı.
- [x] **A2** (2026-09-07) `parseFlights`, `jsonLdObjects`, `parseTrDuration`, `aggregateLowPrice`, `flightLandingUrl` (`obilet.ts`), `SourceFlight` tipi, fixture `OBILET_FLIGHT_PAGE`, testler O.6-O.8. Orijinal tanım: obilet uçak JSON-LD ayrıştırıcı (`Flight` -> `FlightOffer`, `source: 'obilet'`; tarih yoksa `date: null`, `departureAt`
      saat-only olduğu için `departureAt` yerine `departureTime` alanı; sözleşmeye `date | null` eklenir). Testler.
- [x] **A3** (2026-09-07) `parseHotels`, `hotelLandingUrl` (`obilet.ts`), `SourceHotel` tipi (fiyat alanı yok), fixture `OBILET_HOTEL_PAGE`, testler O.9-O.10. Orijinal tanım: obilet otel JSON-LD ayrıştırıcı (`Hotel` -> `HotelOffer`, olanaklar `LocationFeatureSpecification`), fiyat yok. Testler.
- [x] **A4** (2026-09-07) parça 2: `src/server/sources/search.ts` (`runSourceSearch`: paralel, kaynak başına başarı/hata, `cheapestBySource`), `src/server/sources/http.ts` (`GET /api/search`, 400/405/204, başarı varsa 5 dk kenar önbelleği), Vite plugin `/api/search`, Vercel `api/search.ts` + vercel.json, `SearchEnvelope` tipleri, testler T.1-T.4; canlı: obilet İstanbul-Ankara 30 sefer, en düşük 650 TL. Parça 1 (2026-09-07): `src/lib/sources/urls.ts` allowlist (`isAllowedSourceUrl`, `sourceOfAllowedUrl`, `allowedUrlGuard`), `src/server/sources/registry.ts` (`SourceAdapter`, obilet/biletall adaptörleri, `resolve`, `parse`, `fetchSourcePage`), `fetch.ts` `allow` seçeneği ve microdata'yı tanıyan `hasStructuredData`, testler R.1-R.4. Kalan parça 2: `GET /api/search` (paralel kaynaklar, per-source hata, `merged`) + smoke. Orijinal tanım: Fetch katmanının host bazlı genelleştirilmesi (`hostPolicy(url)`: allowlist, hız, robots) ve `src/server/sources/registry.ts`;
      `GET /api/search` (paralel, per-source hata). Testler + smoke.
- [x] **A5** (2026-09-07) parça 2b: App `runOtherSources` (Turna ile paralel, en yeni sorgu kazanır, feribot/araç için kaynak yok), SearchResults `otherSources` prop'u ve `OtherSourcesPanel` dört dalda (liste, boş-ok, otobüs/uçak facts-only, şehir), testler W.1-W.2; canlı: İstanbul-Ankara otobüs aramasında obilet 30 sefer (en düşük 650 TL) + biletall (599 TL) Turna listesinin altında, karşılaştırma cümlesi "Turna.com 500 TL, biletall.com 599 TL, obilet.com 650 TL". Kaynak filtresi UI'ya eklenmedi (kaynaklar zaten ayrı bölümlerde; istenirse A6 sonrası). Parça 2a TAMAMLANDI (2026-09-07): `src/components/results/OtherSourcesPanel.tsx` (kaynak başına bölüm: rozet + kaynak sayfa bağlantısı, N sefer/uçuş/otel, en düşük fiyat, alınma saati; otobüs/uçak/otel satır şekilleri; hata satırları; `dropped`; "Kaynaklar arası en düşük fiyat" cümlesi Turna dahil; açıklama notu), testler U.1-U.3. Kalan parça 2b: App `fetchSearch` çağrısı ve SearchResults'a paneli bağlamak, Hero/App kaynak filtresi, SSR pini. Parça 1 (2026-09-07): `src/lib/sources/client.ts` (`buildSearchUrl`, `parseSearchEnvelope` satır satır guard, `fetchSearch` zaman aşımı/iptal/ağ/HTTP hata durumları), `src/components/results/SourceBadge.tsx`, testler C.1-C.4. Kalan parça 2: App `fetchSearch` çağrısı (Turna ile birlikte), `SearchResults` içinde kaynak satırları (`SourceBusTrip`/`SourceFlight` -> kart), çoklu kaynak `ProvenanceStrip`, karşılaştırma satırı, kaynak filtresi, SSR testleri. Orijinal tanım: UI: `SourceBadge`, çoklu kaynak `ProvenanceStrip`, karşılaştırma satırı, kaynak filtresi; App `fetchSearch`. SSR testleri.
- [x] **A6** (2026-09-07) parça 2: `source: 'turna'` alanı üç tarafta (bileo ve panel `types.ts` + `parse.ts`, Python `models.py` varsayılan "turna"), bileo guard eski önbellek gövdelerinde alanı doldurur ve yabancı değeri reddeder, iyi biçimli satırlar kimlik korunarak geçer; parite testi 45/45. Parça 1: biletall A4/A5 ile aktif; `bySource` sayaçları TAMAMLANDI (2026-09-07: `TurnaMetrics.recordSource`, `/api/search` isteği `search:{kind}` türüyle ve her kaynak yanıtı kaynak kimliğiyle sayılır, `?stats=1` özetine `bySource`, panel tipi isteğe bağlı alanı tanır, test M.1). Kalan: panel/Python sözleşmesine `source` alanı paritesi (TurnaOffer türlerine `source: 'turna'` üç tarafta, parite testi). Orijinal tanım: biletall (aynı microdata, ikinci host) + `bySource` sayaçları + panel/Python `source` alanı paritesi.

### Faz B: otelz
- [x] **B1** (2026-09-07) `src/server/sources/otelz.ts` (`extractOtelzFacilities`, `parseOtelzHotels`: JSON-LD Hotel + facilities id birleşimi; canlı sayfada `netPrice` her satırda 0 olduğu için fiyat yayımlanmıyor, `SourceHotel` fiyatsız kalır), `otelzAdapter` kayıt defterinde, fixture `OTELZ_HOTEL_PAGE`, testler O.11-O.12 ve R/T pin güncellemeleri. Orijinal tanım: otelz `__NEXT_DATA__` ayrıştırıcı (`facilities[]`: name, score, likes, netPrice, lat/lng, img, hasFreeCancellation) +
      JSON-LD `Hotel` birleşimi; fiyat "landing fiyatı, tarihe bağlı" etiketiyle. Testler.
- [x] **B2** (2026-09-07) `src/lib/sources/hotelMatch.ts` (ad normalizasyonu: tire sonrası pazarlama eki, jenerik kelimeler, Türkçe harf katlama; yer uyumu: ilçe/şehir tokenları çelişmesin; kaynak başına tek aday, belirsizse eşleşme yok), `HotelResults` kartında "Diğer kaynaklarda: obilet.com 8,8/10 (18 yorum) · otelz.com 9,6/10 (20 yorum)" bağlantılı satır, SearchResults otel dalı `otherSources` zarfından eşleşmeleri hesaplar; testler H.1-H.3. Orijinal tanım: Otel karşılaştırma ekranı: Turna + obilet + otelz aynı otelin puanlarını yan yana (ad + ilçe eşleştirmesi, belirsizse
      eşleştirme yapılmaz).

### Faz C: Tren ve feribot (araştırma)
- [x] **C1** (2026-09-07, 1 canlı istek) Araştırıldı ve REDDEDİLDİ: `sitemap.xml` ve `robots.txt` aynı 30 KB Angular kabuğunu döndürür, sayfada bağlantı yok, tüm veri `api.tcddtasimacilik.gov.tr/api/` özel API'sinden gelir; PDF tarife bağlantısı bulunamadı. Landing/robots ilkeleriyle uyumlu bir yol yok; Tren sekmesi dürüst "canlı veri yok" durumunda kalır. Orijinal tanım: TCDD Taşımacılık: sitemap ve "YHT tarife" sayfalarının robots/erişim kontrolü; PDF tarife ise `crw` ile ayrıştırma denemesi.
      Sonuç ne olursa olsun belgelenir; Tren sekmesi ancak resmi tarife bulunursa açılır.
- [x] **C2** (2026-09-07, 0 canlı istek; keşif verisi) REDDEDİLDİ: ido.com.tr ana sayfası 2 KB istemci tarafı kabuk (sefer bilgisi API ile yükleniyor); BUDO ve GESTAŞ alan adları çözümlenemedi. Feribot için Turna rota bilgileri tek kaynak kalır. Orijinal tanım: İDO/BUDO: yalnızca sunucu tarafı render edilen sefer sayfası varsa; SPA ise reddedilir.

### Faz D: enuygun ve flixbus
- [x] **D1** (2026-09-07, 2 canlı istek) Kalıplar bulundu: otobüs `/otobus-bileti/{a}-{b}/`, uçak `/ucak-bileti/{a}-{b}-{kodA}-{kodB}/`, otel `/otel/bolge/{şehir}-{id}/`, araç `/arac-kiralama/sehir/{şehir}/`. Otobüs rota sayfası: HTTP 200, 12,4 sn, 842 KB, JSON-LD `BusTrip` x40 ISO tarih-saat ve fiyatla; bot engeli yok ("challenge" kelimesi yalnızca bir script içinde). Kayıtlar: `sources/enuygun_home.html`, `enuygun_bus.html`, `enuygun_bus.jsonld.json`. Orijinal tanım: enuygun rota URL kalıbı (ana sayfadaki popüler rota bağlantılarından; robots izinli); yavaşlık ve bot şüphesi ölçülür.
- [x] **D2** (2026-09-07, toplam 4 canlı istek, iki tur) Kalıp bulundu: `network/0` alt sitemap'inde 24.014 `/otobus-seferleri/{a}-{b}` rotası (660 `/otobus/{şehir}` sayfası). Ankara-İstanbul rota sayfası: 200, 12,3 sn, 166 KB; JSON-LD `Product/AggregateOffer` lowPrice 999 TL offerCount 10, `BusTrip` saat içermiyor, `BusStop` koordinatlı, `FAQPage` süre/ilk-son kalkış/durak sayısı. Tarife yayımlanmadığı için sefer listesi kaynağı olamaz; rota bilgisi kaynağı olarak D5'e alındı. Kayıtlar: sources/flixbus_sitemap_network0.xml, flixbus_route.html, flixbus_route.jsonld.json. Parça 1: `sitemap/sitemap-v2.xml` indeksi 3 alt sitemap veriyor (`content/0`, `network/0`, `network/1`); `content/0` yalnızca 52 kurumsal/hizmet sayfası (rota yok). Rota sayfaları büyük olasılıkla `network/0-1` içinde; sonraki turda `network/0` (1 istek) ve bulunursa bir rota sayfası (2. istek) ölçülür. Her yanıt yaklaşık 12,5 sn. Orijinal tanım: flixbus rota sayfası kalıbı (`/otobus/istanbul/ankara` yönlendirdi; sitemap-v2 incelenir).
- [x] **D3** (2026-09-07) parça 2: `src/server/sources/enuygun.ts` (`parseEnuygunBusTrips`: JSON-LD BusTrip -> tarihli `SourceBusTrip`, `splitIsoLocal`, `isoDiffMinutes`, `routeCities` Product adından; `enuygunBusLandingUrl`), `enuygunAdapter` kayıt defterinde (otobüs), fixture `ENUYGUN_BUS_PAGE`, testler O.13-O.14 ve R.2/T.1/T.2/M.1 pinleri; `/api/search` otobüs aramaları artık obilet + biletall + enuygun. Parça 1 TAMAMLANDI (2026-09-07): `hostTimeouts(host)` (`fetch.ts`: enuygun 24 sn deneme / 26 sn bütçe, Vercel 30 sn ve tarayıcı 28 sn sınırlarının altında; diğer hostlar 10/22 sn), `SourceId` + etiket + origin `enuygun`, allowlist `^https://www\.enuygun\.com/otobus-bileti/{slug}-{slug}/$` (sondaki eğik çizgi zorunlu), `SourceBusTrip.date: string | null` ve istemci guard'ı ISO tarihi kabul eder; testler R.5 ve pin güncellemeleri. Kalan parça 2: JSON-LD `BusTrip` ayrıştırıcı (`enuygun.ts`), adaptör, fixture, `/api/search` katılımı. Orijinal tanım: enuygun otobüs adaptörü: allowlist `^https://www\.enuygun\.com/otobus-bileti/{slug}-{slug}/$`, host politikası (deneme zaman aşımı 30 sn, toplam bütçe 40 sn; mevcut 10/22 sn bu hosta yetmez), JSON-LD `BusTrip` ayrıştırıcı (ISO tarih-saat -> `date` + saatler; `SourceBusTrip.date` tipini `string | null` yapmak gerekir), fixture kayıtlı sayfadan, `/api/search` ve panele katılım.
- [x] **D5** (2026-09-07, 0 canlı istek, iki tur: Parça 1 tip + ayrıştırıcı + fixture + O.18; Parça 2 allowlist + `HOST_TIMEOUTS` + `flixbusAdapter` + istemci doğrulayıcı + panelde rota satırı, karşılaştırma cümlesinde "999 TL'den") flixbus rota bilgisi adaptörü: allowlist `^https://www\.flixbus\.com\.tr/otobus-seferleri/{slug}-{slug}$`, `AggregateOffer.lowPrice` + FAQ'dan süre/ilk-son kalkış, `SourceRouteFacts` tipi; karşılaştırma satırına "flixbus.com.tr 999 TL'den" (tarife olmadığı açıkça yazılır). Ancak D3 ve D4 bittikten sonra. Canlı doğrulama (2026-09-07, dev sunucu `/api/search?kind=bus&from=istanbul&to=ankara&sources=flixbus`, 1 sayfa + 1 robots isteği, 12,3 sn): İstanbul Avrupa - Ankara 999 TL'den, 10 teklif, yaklaşık 375 dk, 544 km, ilk 00:20 / son 23:59, duraklar Esenler + Alibeyköy -> Ankara Otogar + Seferpark Niğde; robots.txt 5 sn'de zaman aşımına uğrayıp izinli sayıldı, bu yüzden yavaş hostlar için 12 sn robots zaman aşımı eklendi (R.6).
- [x] **D4** (2026-09-07, 2 canlı istek) Kod tabloları çıkarıldı (`sources/enuygun_tables.json`: 13 uçak şehir kodu, 20 otel bölge id'si) ve sayfalar ölçüldü: uçak sayfası JSON-LD `Flight` x18 tarihli ISO (+03:00), ISO 8601 süre (PT1H), IATA kodlu havalimanları, TRY fiyat; otel sayfası `Hotel` x20 puan/yorum/ilçe, yıldız ve fiyat yok. Her ikisi entegre edilebilir; D6 ve D7 eklendi.
- [x] **D6** (2026-09-07) `ENUYGUN_FLIGHT_CITY_CODES` (13 şehir; tabloda olmayan şehir çözümlenmez), `enuygunFlightLandingUrl`, allowlist uçak kuralı, `parseIsoDuration`, `parseEnuygunFlights` (ISO +03:00 kalkış -> tarih + saat, varış = kalkış + yayımlanan süre, süre yoksa satır atlanır), `SourceFlight.date: string | null` ve guard, adaptör kinds ['bus','flight'], panelde uçuş satırına gün etiketi, fixture `ENUYGUN_FLIGHT_PAGE`, testler O.15-O.16 ve pinler. Orijinal tanım: enuygun uçak adaptörü: `ENUYGUN_FLIGHT_CITY_CODES` tablosu (13 şehir; tabloda olmayan şehir -> `route_not_found` benzeri dürüst hata, tahmin yok), allowlist `^https://www\.enuygun\.com/ucak-bileti/{slug}-{slug}-[a-z]{3,5}-[a-z]{3,5}/$`, JSON-LD `Flight` -> `SourceFlight` (`date` alanı `string | null` olacak, PT1H süre çözümü), fixture `enuygun_flight.html`, testler.
- [x] **D7** (2026-09-07, 0 canlı istek; kayıtlı `sources/enuygun_hotel.html` fixture oldu) enuygun otel adaptörü: `ENUYGUN_HOTEL_REGION_IDS` tablosu (20 bölge), allowlist `^https://www\.enuygun\.com/otel/bolge/{slug}-\d+/$`, JSON-LD `Hotel` -> `SourceHotel` (yıldız null, fiyat yok, `addressLocality` ilçe), fixture `enuygun_hotel.html`, otel karşılaştırmasına katılım.
- [x] **D4 (eski tanım)** enuygun uçak/otel: ana sayfa bağlantılarından şehir kodu ve bölge id tablosu; yalnızca tabloda olan şehirler; ölçüm sonrası karar.

## 4. Kabul kriterleri
- Her kaynak için: allowlist testi, robots testi, fixture tabanlı ayrıştırıcı testi, `source` alanı, ProvenanceStrip'te kaynak bağlantısı.
- `npm test` yeşil, `npm run build` temiz; Python parite testi `source` alanını üç tarafta doğrular.
- Hiçbir ekranda kaynaksız fiyat yok; çok kaynaklı ekranda her fiyatın yanında kaynak rozeti.
- Kaynak bazlı gözlemlenebilirlik: her kaynak yanıtı `/api/turna?stats=1` altında `bySource` sayaçlarına yazılır (ok, failed,
  hata kodları, fetchedVia ve başarılı çekimler için gecikme p50/p95/max); nexora-panel bileo kartı bunları kaynak tablosunda gösterir
  (bileo M.1-M.2, panel `bileoSourceRows`). Yavaş hostlar için robots.txt okuma zaman aşımı 12 sn (R.6).

## 5. Uygulanan kaynak matrisi (2026-09-07, Faz A-D tamam)

Hangi kaynaktan hangi tür veri geliyor ve neyin **gelmediği**. "Tarih" sütunu takvim günü demektir; saat-only kaynaklarda arayüz gün
uydurmaz. Hiçbir kaynakta koltuk doluluğu yayımlanmaz. Her öğe `source` alanı taşır ve `OtherSourcesPanel` kaynak rozetiyle gösterir.

| Kaynak | Otobüs | Uçak | Otel | Rota bilgisi | Tarih | Fiyat | Puan / yıldız | Tarife (kalkış listesi) | Katman | Not |
|---|---|---|---|---|---|---|---|---|---|---|
| **obilet.com** | 30 sefer | 10 uçuş | 10 otel | - | Yok (yalnızca saat) | Otobüs, uçak | Otel: puan/10 + yorum + yıldız | Var (yaklaşan seferler) | microdata (otobüs), JSON-LD (uçak, otel) | Otelde fiyat yok |
| **biletall.com** | 30 sefer | - | - | - | Yok | Otobüs | - | Var | obilet ile aynı microdata | Aynı altyapı |
| **otelz.com** | - | - | 20 otel | - | - | Yok (`netPrice` hep 0) | Puan/10 + yorum; yıldız yok | - | JSON-LD Hotel + `__NEXT_DATA__` facilities | Açıklama ve olanaklar var |
| **enuygun.com** | 40 sefer | 18 uçuş (13 şehir kodu) | 20 otel (20 bölge id) | - | **Var** (ISO, otobüs ve uçak) | Otobüs, uçak | Otel: puan/10 + yorum + ilçe; yıldız yok | Var (tarihli yaklaşan seferler) | JSON-LD | Yavaş host (~12,5 sn), 24/26 sn zaman aşımı; kod ve id tablosu dışı şehirler reddedilir |
| **flixbus.com.tr** | - | - | - | Başlangıç fiyatı, teklif sayısı, tipik süre, km, ilk/son kalkış, duraklar | Yok | Yalnızca "TL'den" başlangıç | - | **Yok** (`hasTimetable: false`) | JSON-LD Product/AggregateOffer + BusTrip + FAQ | Yavaş host; karşılaştırma cümlesinde "999 TL'den" |
| Turna.com | Var | Var | Var (fiyatsız) | - | **Var** (uçak, otobüs; `date`) | Uçak, otobüs, araç | Otel: puan + yıldız | Var | JSON-LD + RSC | Ayrı sözleşme (`lib/turna`), koltuk doluluğu yayımlanmaz (GELISTIRME_PLANI bölüm 1) |

Reddedilenler ve nedeni: tcddtasimacilik.gov.tr (Angular kabuğu, özel API), ido.com.tr (SPA), ucuzabilet.com (Cloudflare 403),
turkishairlines.com (havayolu siteleri kapsam dışı), kamilkoc.com.tr ve metroturizm.com.tr (flixbus'a yönlendirme / SPA),
skyscanner ve trip.com (yabancı toplayıcı, ağır bot koruması).

Otel puanı karşılaştırması: Turna otel kartı, aynı normalize edilmiş ada ve uyumlu konuma (ilçe ya da şehir belirteci ortak) sahip
obilet, otelz ve enuygun kayıtlarının puanını "Diğer kaynaklarda:" satırında kaynak bağlantısıyla gösterir; kaynak başına en fazla bir
aday, iki aynı adlı adayda hiçbiri kullanılmaz, fiyat hiçbir zaman girmez (`hotelMatch.ts`; H.2, H.4, H.5).

Yenileme: `/api/search?refresh=1` tüm kaynaklarda sunucu sayfa önbelleğini atlar, fetch katmanı URL başına dakikada bir yenilemeye izin verir ve aşımı uyarıyla bildirir (T.5, U.8; 2026-09-07 düzeltmesi). Turna engellendiğinde diğer kaynaklar hata bildiriminin altında görünmeye devam eder ve bildirim "Diğer kaynakların sonuçları aşağıda." der (W.3); Turna yüklenirken yanıtı gelmiş kaynaklar iskeletin altında gösterilir, yükleme göstergesi yinelenmez (W.4).

Ortak koruma katmanı (tüm kaynaklar): host allowlist (`lib/sources/urls.ts`, yalnızca tarihsiz landing yolları; eğik çizgi kuralı
hosta göre), robots.txt okuması (24 saat önbellek, 5 sn; yavaş hostlarda 12 sn), host bazlı zaman aşımı (varsayılan 10/22 sn;
enuygun ve flixbus 24/26 sn), URL başına 10 dk sayfa önbelleği, host kapısı ve dönen bütçe, kaynak bazlı sayaçlar
(`/api/turna?stats=1` `bySource`, nexora-panel tablosu). Testler: `sources.test.ts` O (ayrıştırıcılar), R (allowlist, adaptörler,
zaman aşımları, robots), T (arama zarfı ve HTTP), C (istemci doğrulayıcı), U (panel SSR), H (otel eşleştirme), M (sayaçlar).
