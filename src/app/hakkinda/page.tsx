import type { Metadata } from "next";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Nasıl hesaplanır?" };

const ITEMS: [string, string][] = [
  ["Form (G/B/M)", "Takımın son 5 maçının sonucu. En yeni maç en sağdadır."],
  ["Maç başı puan", "Galibiyet 3, beraberlik 1 puan sayılarak, toplam puanın oynanan maç sayısına bölümü."],
  ["Attığı / yediği gol (ort.)", "İlgili maçlarda atılan ve yenen gollerin maç başına ortalaması."],
  ["Gol yemediği maç", "Rakibin hiç gol atamadığı maçların yüzdesi."],
  ["Gol atamadığı maç", "Takımın hiç gol atamadığı maçların yüzdesi."],
  ["1.5 / 2.5 / 3.5 üstü biten", "Toplam golün sırasıyla en az 2, 3 veya 4 olduğu maçların yüzdesi."],
  ["İki takımın da gol attığı (KG)", "Her iki takımın da en az bir gol attığı maçların yüzdesi."],
  ["İç saha / deplasman", "Ev sahibinin yalnızca kendi sahasındaki, konuk takımın yalnızca deplasmandaki maçları."],
  ["Aralarındaki maçlar", "İki takımın birbirleriyle oynadığı son en fazla 10 resmi maç."],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Nasıl hesaplanır?</h1>
      <p className="text-muted">
        Bültenin Oğlu&apos;ndaki istatistikler oynanmış maçların skorlarından doğrudan hesaplanır. Öneriler ise bu
        istatistiklerden basit bir modelle türetilir.
      </p>
      <Card>
        <dl className="divide-y divide-line">
          {ITEMS.map(([term, desc]) => (
            <div key={term} className="grid gap-1 py-3 sm:grid-cols-[14rem_1fr]">
              <dt className="font-semibold">{term}</dt>
              <dd className="text-sm text-muted">{desc}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <h2 className="pt-2 text-xl font-bold">Öneri modeli</h2>
      <Card>
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          <li>
            <strong>Beklenen gol:</strong> Ev sahibinin bu sezon evinde attığı gol ortalaması ile konuk takımın
            deplasmanda yediği gol ortalaması çarpılıp lig ortalamasına bölünür. Konuk takım için de tersi yapılır.
          </li>
          <li>
            <strong>Az maç düzeltmesi:</strong> Sezon başında birkaç maçlık veri yanıltıcı olabileceği için her
            takımın ortalamasına 3 maçlık &quot;lig ortalaması&quot; eklenir.
          </li>
          <li>
            <strong>Skor olasılıkları:</strong> Beklenen gollerden Poisson dağılımıyla 0-0&apos;dan 10-10&apos;a kadar her
            skorun ihtimali hesaplanır. 1/X/2, çifte şans, 2.5 alt/üst ve KG ihtimalleri bu skorların toplamıdır.
          </li>
          <li>
            <strong>Öneri:</strong> 1, X, 2, 2.5 Üst/Alt ve KG Var/Yok arasında ihtimali en yüksek olan seçenektir.
            Çifte şans her zaman yüksek çıktığı için öneri olarak seçilmez, tabloda gösterilir.
          </li>
        </ol>
      </Card>
      <Card title="Modelin bilmedikleri">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Sakat ve cezalı oyuncular, kadro rotasyonu, teknik direktör değişikliği</li>
          <li>Hafta içi Avrupa maçı yorgunluğu, derbi havası, motivasyon</li>
          <li>Hava durumu, saha, hakem</li>
        </ul>
        <p className="mt-3 text-sm text-muted">
          Öneriyi kullanmadan önce maç sayfasındaki form ve kadro bilgisine mutlaka bakın.
        </p>
      </Card>
      <p className="text-sm text-muted">
        Maç sayfalarında &quot;son 10 maç&quot; tüm turnuvaları kapsar. Örneklem küçük olduğunda yüzdeler sert değişebilir;
        5 maçlık bir dilimde tek bir maç %20 fark yaratır.
      </p>
    </div>
  );
}
