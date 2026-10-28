import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchResults } from "@/components/MatchResults";
import { StandingsTable } from "@/components/StandingsTable";
import { Card, CompareRow, dec, FormBadges, pct, TeamLogo } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/date";
import { headToHeadStats, teamStats, type TeamStats } from "@/lib/stats";
import type { StandingRow } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const match = await getProvider().getMatch((await params).id).catch(() => null);
  return { title: match ? `${match.home.name} - ${match.away.name} istatistikleri` : "Maç" };
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  const provider = getProvider();
  const match = await provider.getMatch(id);
  if (!match) notFound();

  const [homeMatches, awayMatches, h2h, standings] = await Promise.all([
    provider.getTeamMatches(match.home.id, 20),
    provider.getTeamMatches(match.away.id, 20),
    provider.getHeadToHead(match.home.id, match.away.id, 10),
    provider.getStandings(match.league.id).catch((): StandingRow[] => []),
  ]);

  // Bitmiş bir maçı görüntülerken o maçın kendisi "öncesi" istatistiklere karışmasın.
  const before = (list: typeof homeMatches) => list.filter((m) => m.kickoff < match.kickoff);
  const hm = before(homeMatches);
  const am = before(awayMatches);
  const h2hBefore = before(h2h);

  const home10 = teamStats(match.home.id, hm.slice(0, 10));
  const away10 = teamStats(match.away.id, am.slice(0, 10));
  const homeAtHome = teamStats(match.home.id, hm, "home");
  const awayAway = teamStats(match.away.id, am, "away");
  const h = headToHeadStats(match.home.id, match.away.id, h2hBefore);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-panel p-5">
        <div className="mb-4 text-center text-xs text-muted">
          <Link href={`/lig/${match.league.id}`} className="hover:text-accent">
            {match.league.country} · {match.league.name}
          </Link>{" "}
          · {formatDate(match.kickoff, { weekday: "long" })} {formatTime(match.kickoff)}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
          <TeamHeader team={match.home} form={home10.form} />
          <div className="text-center">
            {match.score ? (
              <div className="font-mono text-3xl font-extrabold">
                {match.score.home} - {match.score.away}
              </div>
            ) : (
              <div className="text-2xl font-bold text-muted">{formatTime(match.kickoff)}</div>
            )}
            <div className="mt-1 text-xs text-muted">
              {{ finished: "Maç sonu", live: "Canlı", scheduled: "Başlamadı", other: "Ertelendi / iptal" }[match.status]}
            </div>
          </div>
          <TeamHeader team={match.away} form={away10.form} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`Son ${Math.max(home10.played, away10.played)} maç · tüm turnuvalar`}>
          <StatsCompare home={home10} away={away10} />
        </Card>
        <Card title={`${match.home.name} evinde · ${match.away.name} deplasmanda`}>
          {homeAtHome.played && awayAway.played ? (
            <>
              <StatsCompare home={homeAtHome} away={awayAway} />
              <p className="mt-2 text-[11px] text-muted">
                Ev: son {homeAtHome.played} iç saha maçı · Deplasman: son {awayAway.played} dış saha maçı
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">Yeterli veri yok.</p>
          )}
        </Card>
      </div>

      <Card title={`Aralarındaki maçlar (son ${h.played})`}>
        {h.played ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <H2HTile label={match.home.name} value={h.winsA} total={h.played} />
              <H2HTile label="Beraberlik" value={h.draws} total={h.played} />
              <H2HTile label={match.away.name} value={h.winsB} total={h.played} />
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-muted">
              <span>Maç başı gol: <strong className="text-white">{dec(h.avgTotal)}</strong></span>
              <span>2.5 üstü biten: <strong className="text-white">{pct(h.over25Pct)}</strong></span>
              <span>İki takımın da gol attığı: <strong className="text-white">{pct(h.bttsPct)}</strong></span>
            </div>
            <MatchResults matches={h2hBefore} />
          </div>
        ) : (
          <p className="text-sm text-muted">Kayıtlı karşılaşma yok.</p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`${match.home.name} · son maçlar`}>
          <MatchResults matches={hm.slice(0, 10)} perspective={match.home.id} />
        </Card>
        <Card title={`${match.away.name} · son maçlar`}>
          <MatchResults matches={am.slice(0, 10)} perspective={match.away.id} />
        </Card>
      </div>

      {standings.length > 0 && (
        <Card title="Puan durumu">
          <StandingsTable rows={standings} highlight={[match.home.id, match.away.id]} />
        </Card>
      )}

      <p className="text-center text-xs text-muted">
        Bu sayfadaki tüm rakamlar geçmiş maçlardan hesaplanmıştır ve maçın sonucuna dair bir öngörü içermez.
      </p>
    </div>
  );
}

function TeamHeader({ team, form }: { team: { id: string; name: string; logo?: string }; form: TeamStats["form"] }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <TeamLogo team={team} size={56} />
      <Link href={`/takim/${team.id}`} className="text-base font-bold hover:text-accent sm:text-lg">
        {team.name}
      </Link>
      <FormBadges form={form} size="sm" />
    </div>
  );
}

function StatsCompare({ home, away }: { home: TeamStats; away: TeamStats }) {
  return (
    <div className="divide-y divide-line/50">
      <CompareRow label="Maç başı puan" home={home.pointsPerGame} away={away.pointsPerGame} format={dec} max={3} />
      <CompareRow label="Galibiyet" home={home.won} away={away.won} />
      <CompareRow label="Attığı gol (ort.)" home={home.avgFor} away={away.avgFor} format={dec} />
      <CompareRow label="Yediği gol (ort.)" home={home.avgAgainst} away={away.avgAgainst} format={dec} higherIsBetter={false} />
      <CompareRow label="Gol yemediği maç" home={home.cleanSheetPct} away={away.cleanSheetPct} format={pct} max={100} />
      <CompareRow label="Gol atamadığı maç" home={home.failedToScorePct} away={away.failedToScorePct} format={pct} max={100} higherIsBetter={false} />
      <CompareRow label="Maçlarında toplam gol (ort.)" home={home.avgTotal} away={away.avgTotal} format={dec} />
      <CompareRow label="1.5 üstü biten maç" home={home.over15Pct} away={away.over15Pct} format={pct} max={100} />
      <CompareRow label="2.5 üstü biten maç" home={home.over25Pct} away={away.over25Pct} format={pct} max={100} />
      <CompareRow label="3.5 üstü biten maç" home={home.over35Pct} away={away.over35Pct} format={pct} max={100} />
      <CompareRow label="İki takımın da gol attığı maç" home={home.bttsPct} away={away.bttsPct} format={pct} max={100} />
    </div>
  );
}

function H2HTile({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="rounded-lg bg-panel-2 p-3">
      <div className="text-2xl font-bold">{value}</div>
      <div className="truncate text-xs text-muted">{label}</div>
      <div className="text-[11px] text-muted">{pct(Math.round((value / total) * 100))}</div>
    </div>
  );
}
