import Link from "next/link";
import { ErrorNote, FormBadges, PickChip, TeamLogo } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { addDays, formatDate, formatTime, isValidDate, today } from "@/lib/date";
import { predict } from "@/lib/prediction";
import type { League, Match, StandingRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY_LABELS: Record<number, string> = { [-1]: "Dün", 0: "Bugün", 1: "Yarın" };

export default async function Home({ searchParams }: { searchParams: Promise<{ gun?: string }> }) {
  const { gun } = await searchParams;
  const base = today();
  const date = isValidDate(gun) ? gun : base;
  const provider = getProvider();

  let matches: Match[] = [];
  let error: string | null = null;
  try {
    matches = await provider.getMatchesByDate(date);
  } catch (e) {
    error = (e as Error).message;
  }

  const byLeague = new Map<string, { league: League; matches: Match[] }>();
  for (const m of [...matches].sort((a, b) => a.kickoff.localeCompare(b.kickoff))) {
    const g = byLeague.get(m.league.id) ?? { league: m.league, matches: [] };
    g.matches.push(m);
    byLeague.set(m.league.id, g);
  }

  const standings = new Map<string, StandingRow>();
  const tables = new Map<string, StandingRow[]>();
  await Promise.all(
    [...byLeague.keys()].map(async (id) => {
      try {
        const table = await provider.getStandings(id);
        tables.set(id, table);
        for (const row of table) standings.set(row.team.id, row);
      } catch {
        // Kupa maçlarında puan durumu olmayabilir; satırlar formsuz gösterilir.
      }
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Maç Öncesi İstatistikler</h1>
        <p className="mt-1 text-sm text-muted">
          Maça tıklayın: form, gol ortalamaları, alt/üst ve karşılıklı gol yüzdeleri ile aralarındaki geçmiş maçlar.
        </p>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
          const d = addDays(base, offset);
          const active = d === date;
          return (
            <Link
              key={d}
              href={offset === 0 ? "/" : `/?gun=${d}`}
              className={`shrink-0 rounded-lg border px-3 py-2 text-center text-sm ${
                active ? "border-accent bg-accent/15 text-accent" : "border-line bg-panel text-muted hover:text-white"
              }`}
            >
              <div className="font-semibold">{DAY_LABELS[offset] ?? formatDate(d, { weekday: "short", year: undefined, month: undefined })}</div>
              <div className="text-xs">{formatDate(d, { year: undefined })}</div>
            </Link>
          );
        })}
      </nav>

      {error && <ErrorNote message={error} />}
      {!error && byLeague.size === 0 && (
        <p className="rounded-xl border border-line bg-panel p-6 text-center text-muted">Bu tarihte takip edilen liglerde maç yok.</p>
      )}

      {[...byLeague.values()].map(({ league, matches }) => (
        <section key={league.id} className="overflow-hidden rounded-xl border border-line bg-panel">
          <header className="flex items-center justify-between border-b border-line bg-panel-2 px-4 py-2">
            <Link href={`/lig/${league.id}`} className="text-sm font-semibold hover:text-accent">
              {league.country} · {league.name}
            </Link>
            <span className="hidden text-xs text-muted sm:block">Sıra · Son 5 · Gol ort. (attığı/yediği) · Öneri</span>
          </header>
          <ul className="divide-y divide-line">
            {matches.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                home={standings.get(m.home.id)}
                away={standings.get(m.away.id)}
                table={tables.get(league.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MatchRow({
  match: m,
  home,
  away,
  table,
}: {
  match: Match;
  home?: StandingRow;
  away?: StandingRow;
  table?: StandingRow[];
}) {
  // Biten maçlarda puan durumu o maçın sonucunu da içerdiği için öneri gösterilmez.
  const pred = m.status === "scheduled" && home && away && table ? predict(home, away, table) : null;
  const center =
    m.status === "scheduled" ? (
      <span className="text-sm text-muted">{formatTime(m.kickoff)}</span>
    ) : m.score ? (
      <span className="font-mono font-bold">
        {m.score.home} - {m.score.away}
      </span>
    ) : (
      <span className="text-xs text-muted">{formatTime(m.kickoff)}</span>
    );

  return (
    <li>
      <Link href={`/mac/${m.id}`} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 hover:bg-panel-2">
        <TeamSide team={m.home} row={home} align="right" />
        <div className="flex min-w-12 flex-col items-center">
          {center}
          {m.status === "live" && <span className="text-[10px] font-bold text-loss">CANLI</span>}
          {m.status === "finished" && <span className="text-[10px] text-muted">MS</span>}
          {pred && (
            <span className="mt-1">
              <PickChip market={pred.main.market} p={pred.main.p} small />
            </span>
          )}
        </div>
        <TeamSide team={m.away} row={away} align="left" />
      </Link>
    </li>
  );
}

function TeamSide({ team, row, align }: { team: Match["home"]; row?: StandingRow; align: "left" | "right" }) {
  const right = align === "right";
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${right ? "items-end text-right" : "items-start"}`}>
      <div className={`flex min-w-0 items-center gap-2 ${right ? "flex-row-reverse" : ""}`}>
        <TeamLogo team={team} size={22} />
        <span className="min-w-0 truncate text-sm font-medium sm:text-base">{team.name}</span>
        {row && <span className="shrink-0 rounded bg-panel-2 px-1.5 text-[11px] text-muted">{row.rank}.</span>}
      </div>
      {row && (
        <div className={`hidden items-center gap-2 text-[11px] text-muted sm:flex ${right ? "flex-row-reverse" : ""}`}>
          <FormBadges form={row.form} size="sm" />
          {row.played > 0 && (
            <span>
              {(row.goalsFor / row.played).toFixed(1)} / {(row.goalsAgainst / row.played).toFixed(1)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
