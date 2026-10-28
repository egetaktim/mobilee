import type { Metadata } from "next";
import Link from "next/link";
import { ErrorNote, PickChip } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { addDays, formatDate, formatTime, today } from "@/lib/date";
import { percent, predict, type Prediction } from "@/lib/prediction";
import type { Match, StandingRow } from "@/lib/types";

export const metadata: Metadata = { title: "Günün Önerileri" };

export default async function PicksPage() {
  const provider = getProvider();
  const days = [today(), addDays(today(), 1)];

  let matches: Match[] = [];
  let error: string | null = null;
  try {
    matches = (await Promise.all(days.map((d) => provider.getMatchesByDate(d)))).flat();
  } catch (e) {
    error = (e as Error).message;
  }
  matches = matches.filter((m) => m.status === "scheduled");

  const tables = new Map<string, StandingRow[]>();
  await Promise.all(
    [...new Set(matches.map((m) => m.league.id))].map(async (id) => {
      tables.set(id, await provider.getStandings(id).catch((): StandingRow[] => []));
    }),
  );

  const rows = matches
    .map((m) => {
      const table = tables.get(m.league.id) ?? [];
      const home = table.find((r) => r.team.id === m.home.id);
      const away = table.find((r) => r.team.id === m.away.id);
      return { match: m, pred: home && away ? predict(home, away, table) : null };
    })
    .filter((r): r is { match: Match; pred: Prediction } => r.pred !== null)
    .sort((a, b) => b.pred.main.p - a.pred.main.p);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Günün Önerileri</h1>
        <p className="mt-1 text-sm text-muted">
          Bugün ve yarın başlayacak maçlar, modelin en yüksek ihtimal verdiği seçeneğe göre sıralı.{" "}
          <Link href="/hakkinda" className="underline hover:text-white">Nasıl hesaplanıyor?</Link>
        </p>
      </div>

      {error && <ErrorNote message={error} />}
      {!error && rows.length === 0 && (
        <p className="rounded-xl border border-line bg-panel p-6 text-center text-muted">Öneri hesaplanabilecek maç yok.</p>
      )}

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-line bg-panel">
          <ul className="divide-y divide-line">
            {rows.map(({ match: m, pred }) => (
              <li key={m.id}>
                <Link href={`/mac/${m.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 hover:bg-panel-2">
                  <div className="min-w-0">
                    <div className="text-xs text-muted">
                      {formatDate(m.kickoff, { year: undefined })} {formatTime(m.kickoff)} · {m.league.name}
                    </div>
                    <div className="truncate font-medium">
                      {m.home.name} - {m.away.name}
                    </div>
                    <div className="text-xs text-muted">
                      1 {percent(pred.picks["1"].p)} · X {percent(pred.picks.X.p)} · 2 {percent(pred.picks["2"].p)} · Ü2.5{" "}
                      {percent(pred.picks["2.5 Üst"].p)} · KG {percent(pred.picks["KG Var"].p)}
                    </div>
                  </div>
                  <PickChip market={pred.main.market} p={pred.main.p} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-xs text-muted">
        %65 ve üstü yeşil, %55-65 sarı gösterilir. Yüksek ihtimal bile kesinlik değildir: %70&apos;lik on öneriden
        ortalama üçü tutmaz.
      </p>
    </div>
  );
}
