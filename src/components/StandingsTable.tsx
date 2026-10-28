import type { StandingRow } from "@/lib/types";
import { FormBadges, TeamLink } from "./ui";

export function StandingsTable({ rows, highlight = [] }: { rows: StandingRow[]; highlight?: string[] }) {
  if (!rows.length) return <p className="text-sm text-muted">Puan durumu bulunamadı.</p>;
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="text-xs text-muted">
          <tr className="border-b border-line">
            <th className="px-4 py-2 text-left">#</th>
            <th className="py-2 text-left">Takım</th>
            <th className="py-2">O</th>
            <th className="py-2">G</th>
            <th className="py-2">B</th>
            <th className="py-2">M</th>
            <th className="py-2">A:Y</th>
            <th className="py-2">AV</th>
            <th className="py-2">P</th>
            <th className="px-4 py-2 text-left">Form</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.team.id}
              className={`border-b border-line/60 text-center ${highlight.includes(r.team.id) ? "bg-accent/10" : ""}`}
            >
              <td className="px-4 py-2 text-left text-muted">{r.rank}</td>
              <td className="max-w-48 py-2 text-left">
                <TeamLink team={r.team} size={18} />
              </td>
              <td>{r.played}</td>
              <td>{r.won}</td>
              <td>{r.drawn}</td>
              <td>{r.lost}</td>
              <td className="whitespace-nowrap">
                {r.goalsFor}:{r.goalsAgainst}
              </td>
              <td>{r.goalsFor - r.goalsAgainst > 0 ? "+" : ""}{r.goalsFor - r.goalsAgainst}</td>
              <td className="font-bold">{r.points}</td>
              <td className="px-4 py-2 text-left">
                <FormBadges form={r.form} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
