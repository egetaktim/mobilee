import type { Metadata } from "next";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Uyarı" };

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Uyarı</h1>

      <Card title="Bu site nedir?">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Bültenin Oğlu, küçük bir arkadaş grubu için hazırlanmış <strong>özel</strong> bir istatistik sitesidir; herkese açık değildir.</li>
          <li>Öneriler geçmiş skorlardan hesaplanan <strong>ihtimallerdir, garanti değildir.</strong> Model kadro, sakatlık ve motivasyon gibi bilgileri bilmez.</li>
          <li>Site bahis kabul etmez, para işlemi yapmaz ve bahis sitelerine yönlendirmez.</li>
        </ul>
      </Card>

      <Card title="Hatırlatma">
        <div className="space-y-3 text-sm text-muted">
          <p>
            Türkiye&apos;de spor bahsi yalnızca yetkili kuruluşlar (iddaa ve lisanslı bayileri) üzerinden yasaldır; izinsiz
            sitelerde bahis oynamak ve oynatmak 7258 sayılı Kanun kapsamında suçtur. Bahis 18 yaşından küçükler için yasaktır.
          </p>
          <p>
            Kombine kuponlarda her eklenen maç tutma ihtimalini çarparak düşürür: %70 ihtimalli dört maçın birlikte tutma
            ihtimali yaklaşık %24&apos;tür. Yalnızca kaybetmeyi göze alabileceğiniz tutarla oynayın.
          </p>
        </div>
      </Card>

      <Card title="Veri kaynağı">
        <p className="text-sm text-muted">
          Maç verileri API-Football&apos;dan alınır ve gecikmeli veya hatalı olabilir. Resmi sonuçlar için federasyon ve
          kulüp açıklamaları esastır.
        </p>
      </Card>

      <Card title="Yardım">
        <p className="text-sm text-muted">
          Şans oyunları sizin veya bir yakınınız için sorun hâline geldiyse Yeşilay Danışmanlık Merkezi (YEDAM){" "}
          <strong className="text-white">115</strong> numaralı hattan ücretsiz destek verir.
        </p>
      </Card>
    </div>
  );
}
