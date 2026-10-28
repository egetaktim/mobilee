import type { FormResult, Match, StandingRow, Team } from "./types";

/** Oynanmış lig maçlarından iç saha / deplasman ayrımlı puan durumu üretir. */
export function buildStandings(results: Match[], teams: Team[] = []): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  const row = (team: Team) => {
    let r = rows.get(team.id);
    if (!r) {
      r = {
        rank: 0, team, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, form: [],
        home: { played: 0, goalsFor: 0, goalsAgainst: 0 },
        away: { played: 0, goalsFor: 0, goalsAgainst: 0 },
      };
      rows.set(team.id, r);
    }
    return r;
  };
  teams.forEach(row);

  const apply = (r: StandingRow, gf: number, ga: number, venue: "home" | "away") => {
    const res: FormResult = gf > ga ? "W" : gf < ga ? "L" : "D";
    const split = r[venue]!;
    split.played++;
    split.goalsFor += gf;
    split.goalsAgainst += ga;
    r.played++;
    r.goalsFor += gf;
    r.goalsAgainst += ga;
    if (res === "W") (r.won++, (r.points += 3));
    else if (res === "D") (r.drawn++, r.points++);
    else r.lost++;
    r.form = [...r.form, res].slice(-5);
  };

  for (const m of [...results].sort((a, b) => a.kickoff.localeCompare(b.kickoff))) {
    if (m.status !== "finished" || !m.score) continue;
    apply(row(m.home), m.score.home, m.score.away, "home");
    apply(row(m.away), m.score.away, m.score.home, "away");
  }

  return [...rows.values()]
    .sort(
      (x, y) =>
        y.points - x.points ||
        y.goalsFor - y.goalsAgainst - (x.goalsFor - x.goalsAgainst) ||
        y.goalsFor - x.goalsFor ||
        x.team.name.localeCompare(y.team.name, "tr"),
    )
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
