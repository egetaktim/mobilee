# Bültenin Oğlu

Arkadaş grubu için özel futbol istatistik ve öneri sitesi: form, gol ortalamaları, alt/üst ve karşılıklı
gol yüzdeleri, iç saha/deplasman ayrımı, aralarındaki maçlar, puan durumu ve istatistiksel öneriler.

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:3000
```

Anahtar tanımlı değilse site **demo verisiyle** çalışır: takım isimleri gerçektir, skorlar rastgele
üretilir ve her sayfada uyarı görünür.

## Gerçek veri

`.env.example` dosyasını `.env.local` olarak kopyalayıp anahtarları yazın (`.env.local` git'e girmez).

| Değişken | Kaynak | Ne sağlar |
|---|---|---|
| `FOOTBALL_DATA_KEY` | [football-data.org](https://www.football-data.org) (ücretsiz) | Premier League, Championship, La Liga, Serie A, Bundesliga, Ligue 1, Portekiz, Hollanda, Şampiyonlar Ligi: maçlar, istatistikler, öneriler |
| `API_FOOTBALL_KEY` | [api-football.com](https://www.api-football.com) | Süper Lig, 1. Lig, Avrupa Ligi, Konferans Ligi |
| `API_FOOTBALL_PAID` | | `1` ise API-Football liglerinde de istatistik/öneri açılır. Ücretsiz planda (`0`) yalnızca dün/bugün/yarının maç listesi gelir |

Kimlikler kaynağa göre öneklidir (`fd-`, `af-`); `src/lib/data/index.ts` istekleri doğru kaynağa yönlendirir.
Bir kaynak hata verirse diğerinin maçları yine gösterilir. football-data.org ücretsiz planı dakikada 10
istek verir; yanıtlar Next.js önbelleğinde 5 dk – 24 saat tutulur. Lig listeleri `src/lib/leagues.ts` içindedir.

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
