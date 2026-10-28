import type { Metadata } from "next";
import Link from "next/link";
import { DemoBanner } from "@/components/ui";
import { getProvider } from "@/lib/data";
import "./globals.css";

// Demo uyarısı çalışma zamanındaki API anahtarına bağlı; sayfalar derleme anında sabitlenmesin.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "GolVeri – Futbol İstatistikleri", template: "%s · GolVeri" },
  description:
    "Maç öncesi form, gol ortalamaları, alt/üst ve karşılıklı gol yüzdeleri, H2H ve puan durumu. Bahis tavsiyesi içermez.",
};

const NAV = [
  { href: "/", label: "Maçlar" },
  { href: "/ligler", label: "Ligler" },
  { href: "/hakkinda", label: "Nasıl Hesaplanır?" },
  { href: "/yasal-uyari", label: "Yasal Uyarı" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const provider = getProvider();
  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col font-sans antialiased">
        {provider.isDemo && <DemoBanner />}
        <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3">
            <Link href="/" className="text-lg font-extrabold tracking-tight">
              Gol<span className="text-accent">Veri</span>
            </Link>
            <nav className="-mx-2 flex max-w-full gap-1 overflow-x-auto text-sm whitespace-nowrap">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-md px-3 py-1.5 text-muted hover:bg-panel hover:text-white">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-line bg-panel">
          <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-xs text-muted">
            <p>
              GolVeri yalnızca geçmiş maç verilerinden derlenen istatistikleri gösterir.{" "}
              <strong className="text-white">Tahmin, kupon veya bahis tavsiyesi sunmaz;</strong> bahis oranı yayınlamaz,
              bahis sitelerine yönlendirme yapmaz ve hiçbir şekilde bahis kabul etmez.
            </p>
            <p>
              Geçmiş istatistikler gelecekteki sonuçların garantisi değildir.{" "}
              <Link href="/yasal-uyari" className="underline hover:text-white">
                Yasal uyarıyı okuyun.
              </Link>
            </p>
            <p>© {new Date().getFullYear()} GolVeri</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
