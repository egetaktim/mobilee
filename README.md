# GolVeri

Maç öncesi futbol **istatistikleri** sitesi: form, gol ortalamaları, alt/üst ve karşılıklı gol yüzdeleri,
iç saha/deplasman ayrımı, aralarındaki maçlar ve puan durumu.

Site bilinçli olarak **tahmin, kupon, bahis oranı veya bahis sitesi bağlantısı içermez**. Bütün rakamlar
oynanmış maç skorlarından doğrudan hesaplanır (`src/lib/stats.ts`).

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:3000
```

`API_FOOTBALL_KEY` tanımlı değilse site **demo verisiyle** çalışır: takım isimleri gerçektir, skorlar
rastgele üretilir ve her sayfada uyarı görünür.

## Gerçek veri

1. https://www.api-football.com adresinden anahtar alın (ücretsiz plan günde 100 istek).
2. `.env.example` dosyasını `.env.local` olarak kopyalayıp anahtarı yazın.
3. Takip edilen ligler `src/lib/leagues.ts` içindedir.

Yanıtlar Next.js önbelleğinde tutulur (fikstür 5 dk, istatistikler 1 saat). Bir maç sayfası ilk açılışta
yaklaşık 5 istek yapar; yüksek trafik için ücretli plan gerekir.

## Yapı

| Yol | İçerik |
|---|---|
| `/` | Seçilen günün maçları; sıra, son 5 maç formu, gol ortalamaları |
| `/mac/[id]` | İki takımın karşılaştırmalı istatistikleri, H2H, son maçlar, puan durumu |
| `/lig/[id]` | Puan durumu, lig ortalamaları, takım bazında gol istatistikleri |
| `/takim/[id]` | Genel / iç saha / deplasman istatistikleri ve son maçlar |
| `/hakkinda` | Her istatistiğin nasıl hesaplandığı |
| `/yasal-uyari` | Yasal uyarı ve kullanım koşulları |

## Yasal notlar

- Yasa dışı bahis reklamı ve bahse yönlendirme 7258 sayılı Kanun kapsamında suçtur. Siteye bahis oranı,
  bahis sitesi reklamı veya affiliate bağlantısı **eklemeyin**.
- Maç verilerini başka sitelerden kazımak (scraping) telif ve veritabanı haklarını ihlal edebilir;
  lisanslı bir API kullanın.
- Yayına almadan önce bir hukukçuya danışmanız önerilir.
