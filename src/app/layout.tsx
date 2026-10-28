import type { Metadata } from "next";
import Link from "next/link";
import { DemoBanner } from "@/components/ui";
import { getProvider } from "@/lib/data";
import "./globals.css";

// Demo uyarısı çalışma zamanındaki API anahtarına bağlı; sayfalar derleme anında sabitlenmesin.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Bültenin Oğlu – Futbol İstatistikleri", template: "%s · Bültenin Oğlu" },
  description:
    "Maç öncesi form, gol ortalamaları, alt/üst ve karşılıklı gol yüzdeleri, H2H, puan durumu ve istatistiksel öneriler.",
};

const NAV = [
  { href: "/", label: "Maçlar" },
  { href: "/oneriler", label: "Günün Önerileri" },
  { href: "/ligler", label: "Ligler" },
  { href: "/hakkinda", label: "Nasıl Hesaplanır?" },
  { href: "/yasal-uyari", label: "Uyarı" },
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
              Bültenin <span className="text-accent">Oğlu</span>
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
              Bültenin Oğlu arkadaş grubu için hazırlanmış özel bir istatistik sitesidir. Öneriler geçmiş maç
              verilerinden hesaplanan ihtimallerdir; <strong className="text-white">garanti değildir.</strong>
            </p>
            <p>
              Site bahis kabul etmez ve bahis sitelerine yönlendirmez.{" "}
              <Link href="/yasal-uyari" className="underline hover:text-white">
                Uyarıyı okuyun.
              </Link>
            </p>
            <p>© {new Date().getFullYear()} Bültenin Oğlu</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
