import type { Metadata } from "next";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Yasal Uyarı" };

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Yasal Uyarı ve Kullanım Koşulları</h1>

      <Card title="Bu site ne yapar, ne yapmaz?">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>GolVeri yalnızca oynanmış futbol maçlarının sonuçlarından derlenen <strong>istatistikleri</strong> gösterir.</li>
          <li>Site <strong>tahmin, kupon, &quot;banko&quot; veya bahis tavsiyesi sunmaz</strong>; hiçbir içerik bir sonuca bahis yapılmasını önermez.</li>
          <li>Site <strong>bahis oranı yayınlamaz</strong>, bahis sitelerinin reklamını yapmaz ve bu sitelere bağlantı vermez.</li>
          <li>Site <strong>bahis kabul etmez</strong>, para yatırma veya ödeme işlemi barındırmaz.</li>
          <li>Ücretli üyelik, &quot;VIP tahmin&quot; veya benzeri bir hizmet sunulmaz.</li>
        </ul>
      </Card>

      <Card title="Yasal çerçeve">
        <div className="space-y-3 text-sm text-muted">
          <p>
            Türkiye&apos;de spor müsabakalarına dayalı bahis yalnızca yetkili kuruluşlar tarafından düzenlenebilir.
            7258 sayılı Kanun uyarınca izinsiz bahis oynatmak, buna yer veya imkân sağlamak ve bu tür oyunların
            reklamını yapmak suçtur. GolVeri bu faaliyetlerin hiçbirini yürütmez ve desteklemez.
          </p>
          <p>
            Sitedeki istatistikler geçmiş verilerdir ve gelecekteki sonuçlar için hiçbir garanti vermez. Bu
            bilgilere dayanarak alınan kararların sorumluluğu tamamen kullanıcıya aittir.
          </p>
        </div>
      </Card>

      <Card title="Veri kaynağı ve kişisel veriler">
        <div className="space-y-3 text-sm text-muted">
          <p>
            Maç verileri lisanslı bir veri sağlayıcısından (API-Football) alınır. Veriler gecikmeli veya hatalı
            olabilir; resmi sonuçlar için ilgili federasyon ve kulüplerin açıklamaları esastır.
          </p>
          <p>
            Site üyelik sistemi içermez ve ziyaretçilerden kişisel veri toplamaz. İleride analitik veya çerez
            kullanılması hâlinde 6698 sayılı KVKK kapsamında aydınlatma metni ve çerez onayı eklenecektir.
          </p>
        </div>
      </Card>

      <Card title="Yardım">
        <p className="text-sm text-muted">
          Kendiniz veya bir yakınınız için şans oyunları bir sorun hâline geldiyse Yeşilay Danışmanlık Merkezi
          (YEDAM) <strong className="text-white">115</strong> numaralı hattan ücretsiz destek verir.
        </p>
      </Card>
    </div>
  );
}
