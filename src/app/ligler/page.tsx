import type { Metadata } from "next";
import Link from "next/link";
import { getProvider } from "@/lib/data";

export const metadata: Metadata = { title: "Ligler" };

export default async function LeaguesPage() {
  const leagues = await getProvider().getLeagues();
  const byCountry = Map.groupBy(leagues, (l) => l.country);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ligler</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...byCountry].map(([country, list]) => (
          <section key={country} className="rounded-xl border border-line bg-panel p-4">
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{country}</h2>
            <ul className="space-y-1">
              {list.map((l) => (
                <li key={l.id}>
                  <Link href={`/lig/${l.id}`} className="block rounded px-2 py-1.5 hover:bg-panel-2 hover:text-accent">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
