# Bültenin Oğlu

Arkadaş grubu için özel futbol istatistik ve öneri sitesi: form, gol ortalamaları, alt/üst ve karşılıklı
gol yüzdeleri, iç saha/deplasman ayrımı, aralarındaki maçlar, puan durumu ve istatistiksel öneriler.

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
yaklaşık 5 istek yapar.

## Öneri modeli

`src/lib/prediction.ts`: Takımların bu sezonki iç saha / deplasman gol ortalamalarından beklenen gol
hesaplanır (az maçta lig ortalamasına çekilir), Poisson dağılımıyla skor olasılıkları bulunur. Öneri,
1 / X / 2 / 2.5 Üst-Alt / KG Var-Yok arasında ihtimali en yüksek seçenektir. Öneriler yalnızca
başlamamış maçlar için gösterilir. Model kadro, sakatlık ve motivasyon bilgisi kullanmaz ve geçmiş
maçlarda başarısı ölçülmemiştir.

## Sayfalar

| Yol | İçerik |
|---|---|
| `/` | Seçilen günün maçları; sıra, son 5 maç formu, gol ortalamaları, öneri |
| `/oneriler` | Bugün ve yarının maçları, öneri ihtimaline göre sıralı |
| `/mac/[id]` | Öneri kartı, karşılaştırmalı istatistikler, H2H, son maçlar, puan durumu |
| `/lig/[id]` | Puan durumu, lig ortalamaları, takım bazında gol istatistikleri |
| `/takim/[id]` | Genel / iç saha / deplasman istatistikleri ve son maçlar |
| `/hakkinda` | İstatistiklerin ve öneri modelinin nasıl hesaplandığı |
| `/yasal-uyari` | Uyarılar |
