import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StandingsTable } from "@/components/StandingsTable";
import { Card, dec, pct, StatTile, TeamLink } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { leagueStats, teamStats } from "@/lib/stats";
import type { Match, StandingRow, Team } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const league = await getProvider().getLeague((await params).id);
  return { title: league ? `${league.name} istatistikleri` : "Lig" };
}

export default async function LeaguePage({ params }: Props) {
  const { id } = await params;
  const provider = getProvider();
  const league = await provider.getLeague(id);
  if (!league) notFound();

  const [standings, results] = await Promise.all([
    provider.getStandings(id).catch((): StandingRow[] => []),
    provider.getLeagueResults(id).catch((): Match[] => []),
  ]);
  const ls = leagueStats(results);

  const teams = new Map<string, Team>();
  for (const m of results) {
    teams.set(m.home.id, m.home);
    teams.set(m.away.id, m.away);
  }
  const newestFirst = [...results].sort((a, b) => b.kickoff.localeCompare(a.kickoff));
  const perTeam = [...teams.values()]
    .map((team) => ({ team, s: teamStats(team.id, newestFirst.filter((m) => m.home.id === team.id || m.away.id === team.id)) }))
    .sort((a, b) => b.s.over25Pct - a.s.over25Pct || b.s.avgTotal - a.s.avgTotal);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{league.country}</p>
        <h1 className="text-2xl font-bold">
          {league.name} <span className="text-muted">{league.season}/{String(league.season + 1).slice(2)}</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Oynanan maç" value={String(ls.played)} />
        <StatTile label="Maç başı gol" value={dec(ls.avgGoals)} hint={`Ev ${dec(ls.avgHomeGoals)} · Dep ${dec(ls.avgAwayGoals)}`} />
        <StatTile label="2.5 üstü biten" value={pct(ls.over25Pct)} />
        <StatTile label="İki takımın da gol attığı" value={pct(ls.bttsPct)} />
        <StatTile label="Ev sahibi kazandı" value={pct(ls.homeWinPct)} />
        <StatTile label="Berabere bitti" value={pct(ls.drawPct)} />
        <StatTile label="Deplasman kazandı" value={pct(ls.awayWinPct)} />
      </div>

      <Card title="Puan durumu">
        <StandingsTable rows={standings} />
      </Card>

      {perTeam.length > 0 && (
        <Card title="Takımların gol istatistikleri (bu sezon)">
          <div className="-mx-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-2 text-left">Takım</th>
                  <th>O</th>
                  <th>Attığı ort.</th>
                  <th>Yediği ort.</th>
                  <th>Gol yemedi</th>
                  <th>Gol atamadı</th>
                  <th>2.5 üstü</th>
                  <th className="px-4">KG</th>
                </tr>
              </thead>
              <tbody>
                {perTeam.map(({ team, s }) => (
                  <tr key={team.id} className="border-b border-line/60 text-center">
                    <td className="max-w-48 px-4 py-2 text-left">
                      <TeamLink team={team} size={18} />
                    </td>
                    <td>{s.played}</td>
                    <td>{dec(s.avgFor)}</td>
                    <td>{dec(s.avgAgainst)}</td>
                    <td>{pct(s.cleanSheetPct)}</td>
                    <td>{pct(s.failedToScorePct)}</td>
                    <td>{pct(s.over25Pct)}</td>
                    <td className="px-4">{pct(s.bttsPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-muted">KG: iki takımın da gol attığı maçların oranı.</p>
        </Card>
      )}
    </div>
  );
}
