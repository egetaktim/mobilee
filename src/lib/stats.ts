import type { FormResult, Match } from "./types";

export interface TeamStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  avgFor: number;
  avgAgainst: number;
  avgTotal: number;
  pointsPerGame: number;
  cleanSheetPct: number;
  failedToScorePct: number;
  bttsPct: number;
  over15Pct: number;
  over25Pct: number;
  over35Pct: number;
  form: FormResult[];
}

export type Venue = "all" | "home" | "away";

const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));
const avg = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100) / 100);

export function isFinished(m: Match): m is Match & { score: NonNullable<Match["score"]> } {
  return m.status === "finished" && m.score !== null;
}

export function resultFor(m: Match, teamId: string): FormResult | null {
  if (!isFinished(m)) return null;
  const isHome = m.home.id === teamId;
  const gf = isHome ? m.score.home : m.score.away;
  const ga = isHome ? m.score.away : m.score.home;
  return gf > ga ? "W" : gf < ga ? "L" : "D";
}

/** `matches` yeniden eskiye sıralı olmalı. */
export function teamStats(teamId: string, matches: Match[], venue: Venue = "all"): TeamStats {
  const list = matches.filter(
    (m) =>
      isFinished(m) &&
      (venue === "all" ||
        (venue === "home" && m.home.id === teamId) ||
        (venue === "away" && m.away.id === teamId)),
  ) as (Match & { score: NonNullable<Match["score"]> })[];

  const s = { won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, cs: 0, fts: 0, btts: 0, o15: 0, o25: 0, o35: 0 };
  for (const m of list) {
    const isHome = m.home.id === teamId;
    const gf = isHome ? m.score.home : m.score.away;
    const ga = isHome ? m.score.away : m.score.home;
    const total = gf + ga;
    s.gf += gf;
    s.ga += ga;
    if (gf > ga) s.won++;
    else if (gf < ga) s.lost++;
    else s.drawn++;
    if (ga === 0) s.cs++;
    if (gf === 0) s.fts++;
    if (gf > 0 && ga > 0) s.btts++;
    if (total > 1.5) s.o15++;
    if (total > 2.5) s.o25++;
    if (total > 3.5) s.o35++;
  }

  const n = list.length;
  return {
    played: n,
    won: s.won,
    drawn: s.drawn,
    lost: s.lost,
    goalsFor: s.gf,
    goalsAgainst: s.ga,
    avgFor: avg(s.gf, n),
    avgAgainst: avg(s.ga, n),
    avgTotal: avg(s.gf + s.ga, n),
    pointsPerGame: avg(s.won * 3 + s.drawn, n),
    cleanSheetPct: pct(s.cs, n),
    failedToScorePct: pct(s.fts, n),
    bttsPct: pct(s.btts, n),
    over15Pct: pct(s.o15, n),
    over25Pct: pct(s.o25, n),
    over35Pct: pct(s.o35, n),
    form: list
      .slice(0, 5)
      .map((m) => resultFor(m, teamId)!)
      .reverse(),
  };
}

export interface HeadToHeadStats {
  played: number;
  winsA: number;
  draws: number;
  winsB: number;
  goalsA: number;
  goalsB: number;
  avgTotal: number;
  bttsPct: number;
  over25Pct: number;
}

export function headToHeadStats(teamA: string, teamB: string, matches: Match[]): HeadToHeadStats {
  const list = matches.filter(isFinished) as (Match & { score: NonNullable<Match["score"]> })[];
  const s = { winsA: 0, draws: 0, winsB: 0, goalsA: 0, goalsB: 0, btts: 0, o25: 0 };
  for (const m of list) {
    const aHome = m.home.id === teamA;
    const ga = aHome ? m.score.home : m.score.away;
    const gb = aHome ? m.score.away : m.score.home;
    s.goalsA += ga;
    s.goalsB += gb;
    if (ga > gb) s.winsA++;
    else if (ga < gb) s.winsB++;
    else s.draws++;
    if (ga > 0 && gb > 0) s.btts++;
    if (ga + gb > 2.5) s.o25++;
  }
  const n = list.length;
  return {
    played: n,
    winsA: s.winsA,
    draws: s.draws,
    winsB: s.winsB,
    goalsA: s.goalsA,
    goalsB: s.goalsB,
    avgTotal: avg(s.goalsA + s.goalsB, n),
    bttsPct: pct(s.btts, n),
    over25Pct: pct(s.o25, n),
  };
}

export interface LeagueStats {
  played: number;
  avgGoals: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  bttsPct: number;
  over25Pct: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
}

export function leagueStats(matches: Match[]): LeagueStats {
  const list = matches.filter(isFinished) as (Match & { score: NonNullable<Match["score"]> })[];
  const s = { hw: 0, d: 0, aw: 0, btts: 0, o25: 0, hg: 0, ag: 0 };
  for (const m of list) {
    const { home, away } = m.score;
    s.hg += home;
    s.ag += away;
    if (home > away) s.hw++;
    else if (home < away) s.aw++;
    else s.d++;
    if (home > 0 && away > 0) s.btts++;
    if (home + away > 2.5) s.o25++;
  }
  const n = list.length;
  return {
    played: n,
    avgGoals: avg(s.hg + s.ag, n),
    homeWinPct: pct(s.hw, n),
    drawPct: pct(s.d, n),
    awayWinPct: pct(s.aw, n),
    bttsPct: pct(s.btts, n),
    over25Pct: pct(s.o25, n),
    avgHomeGoals: avg(s.hg, n),
    avgAwayGoals: avg(s.ag, n),
  };
}
