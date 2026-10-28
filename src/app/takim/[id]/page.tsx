import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MatchResults } from "@/components/MatchResults";
import { Card, dec, FormBadges, pct, TeamLogo } from "@/components/ui";
import { getProvider } from "@/lib/data";
import { teamStats, type TeamStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const team = await getProvider().getTeam((await params).id).catch(() => null);
  return { title: team ? `${team.name} istatistikleri` : "Takım" };
}

const ROWS: { label: string; get: (s: TeamStats) => string }[] = [
  { label: "Maç", get: (s) => String(s.played) },
  { label: "G-B-M", get: (s) => `${s.won}-${s.drawn}-${s.lost}` },
  { label: "Maç başı puan", get: (s) => dec(s.pointsPerGame) },
  { label: "Attığı gol (ort.)", get: (s) => dec(s.avgFor) },
  { label: "Yediği gol (ort.)", get: (s) => dec(s.avgAgainst) },
  { label: "Gol yemediği maç", get: (s) => pct(s.cleanSheetPct) },
  { label: "Gol atamadığı maç", get: (s) => pct(s.failedToScorePct) },
  { label: "1.5 üstü biten", get: (s) => pct(s.over15Pct) },
  { label: "2.5 üstü biten", get: (s) => pct(s.over25Pct) },
  { label: "3.5 üstü biten", get: (s) => pct(s.over35Pct) },
  { label: "İki takımın da gol attığı", get: (s) => pct(s.bttsPct) },
];

export default async function TeamPage({ params }: Props) {
  const { id } = await params;
  const provider = getProvider();
  const [team, matches] = await Promise.all([provider.getTeam(id), provider.getTeamMatches(id, 20)]);
  if (!team) notFound();

  const columns = [
    { label: "Genel", s: teamStats(id, matches) },
    { label: "İç saha", s: teamStats(id, matches, "home") },
    { label: "Deplasman", s: teamStats(id, matches, "away") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <TeamLogo team={team} size={56} />
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted">
            Son 5: <FormBadges form={columns[0].s.form} size="sm" />
          </div>
        </div>
      </div>

      <Card title={`Son ${matches.length} maç · tüm turnuvalar`}>
        <div className="-mx-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-2 text-left" />
                {columns.map((c) => (
                  <th key={c.label} className="px-4 py-2">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="border-b border-line/60 text-center">
                  <td className="px-4 py-2 text-left text-muted">{r.label}</td>
                  {columns.map((c) => (
                    <td key={c.label} className="px-4 py-2">{c.s.played ? r.get(c.s) : "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Son maçlar">
        <MatchResults matches={matches} perspective={id} />
      </Card>
    </div>
  );
}
