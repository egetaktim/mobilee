import type { Metadata } from "next";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "İstatistikler nasıl hesaplanır?" };

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
      <h1 className="text-2xl font-bold">İstatistikler nasıl hesaplanır?</h1>
      <p className="text-muted">
        GolVeri&apos;deki her rakam oynanmış maçların skorlarından doğrudan hesaplanır. Hiçbir rakam model, yapay
        zekâ veya yorum içermez; maçın nasıl biteceğine dair bir öngörü değildir.
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
      <p className="text-sm text-muted">
        Maç sayfalarında &quot;son 10 maç&quot; tüm turnuvaları kapsar. Örneklem küçük olduğunda yüzdeler sert değişebilir;
        5 maçlık bir dilimde tek bir maç %20 fark yaratır.
      </p>
    </div>
  );
}
