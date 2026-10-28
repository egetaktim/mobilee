import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchResults } from "@/components/MatchResults";
import { StandingsTable } from "@/components/StandingsTable";
import { Card, CompareRow, dec, FormBadges, pct, PickChip, TeamLogo } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/date";
import { percent, predict, type Market, type Prediction } from "@/lib/prediction";
import { headToHeadStats, teamStats, type TeamStats } from "@/lib/stats";
import type { Match, StandingRow } from "@/lib/types";

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

  const hasStats = provider.hasStats(match.league.id);
  const none = (): Match[] => [];
  // Bir istek (ör. dakikalık limit) düşerse sayfa yine açılsın, o bölüm boş kalsın.
  const [homeMatches, awayMatches, h2h, standings] = hasStats
    ? await Promise.all([
        provider.getTeamMatches(match.home.id, 20).catch(none),
        provider.getTeamMatches(match.away.id, 20).catch(none),
        provider.getHeadToHead(match, 10).catch(none),
        provider.getStandings(match.league.id).catch((): StandingRow[] => []),
      ])
    : [[], [], [], []];

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

  const homeRow = standings.find((r) => r.team.id === match.home.id);
  const awayRow = standings.find((r) => r.team.id === match.away.id);
  const pred = match.status === "scheduled" && homeRow && awayRow ? predict(homeRow, awayRow, standings) : null;

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

      {!hasStats ? (
        <p className="rounded-xl border border-draw/40 bg-draw/10 p-4 text-sm text-draw">
          Bu lig için istatistik ve öneri yok: veri kaynağının (API-Football) ücretsiz planı yalnızca maç listesini
          veriyor. Ücretli plana geçilirse bu sayfa diğer liglerdeki gibi dolar.
        </p>
      ) : (
        <>
          {match.status === "scheduled" &&
            (pred ? (
              <PredictionCard pred={pred} />
            ) : (
              <p className="rounded-xl border border-line bg-panel p-4 text-sm text-muted">
                Bu maç için öneri hesaplanamadı (puan durumu yok, ör. kupa maçı).
              </p>
            ))}

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

        </>
      )}

      <p className="text-center text-xs text-muted">
        Öneri bu sezonun gol ortalamalarından hesaplanan istatistiksel bir tahmindir; garanti değildir.
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

const GROUPS: { title: string; markets: Market[] }[] = [
  { title: "Maç sonucu", markets: ["1", "X", "2"] },
  { title: "Çifte şans", markets: ["1X", "X2"] },
  { title: "Toplam gol", markets: ["2.5 Üst", "2.5 Alt"] },
  { title: "Karşılıklı gol", markets: ["KG Var", "KG Yok"] },
];

function PredictionCard({ pred }: { pred: Prediction }) {
  return (
    <Card title="Bültenin Oğlu'nun önerisi">
      <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-panel-2 p-4 text-center">
          <PickChip market={pred.main.market} p={pred.main.p} />
          <div className="text-sm">{pred.main.label}</div>
          <div className="text-xs text-muted">
            Beklenen gol: {dec(pred.xgHome)} - {dec(pred.xgAway)}
          </div>
          <div className="text-xs text-muted">
            Olası skorlar: {pred.topScores.map((s) => `${s.home}-${s.away} (${percent(s.p)})`).join(", ")}
          </div>
          {pred.lowSample && (
            <div className="text-[11px] text-draw">Az maç oynandı; ihtimaller lig ortalamasına yakın tutuldu.</div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <div className="mb-2 text-xs font-semibold text-muted uppercase">{g.title}</div>
              <ul className="space-y-1.5">
                {g.markets.map((m) => {
                  const p = pred.picks[m];
                  return (
                    <li key={m} className="text-sm">
                      <div className="flex justify-between">
                        <span>
                          <strong>{m}</strong> <span className="text-xs text-muted">{p.label}</span>
                        </span>
                        <span className={p.market === pred.main.market ? "font-bold text-accent" : ""}>{percent(p.p)}</span>
                      </div>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded bg-panel-2">
                        <div className={p.market === pred.main.market ? "h-full bg-accent" : "h-full bg-muted/50"} style={{ width: `${p.p * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
