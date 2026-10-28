/**
 * Basit Poisson modeli. Her takımın bu sezonki iç saha / deplasman gol
 * ortalamalarından beklenen gol sayısını bulur, skor olasılıklarını buradan türetir.
 * Az maç oynanmışsa oranlar lig ortalamasına doğru çekilir.
 */
import type { StandingRow } from "./types";

export type Market = "1" | "X" | "2" | "1X" | "X2" | "2.5 Üst" | "2.5 Alt" | "KG Var" | "KG Yok";

export interface Pick {
  market: Market;
  label: string;
  p: number; // 0-1
}

export interface Prediction {
  xgHome: number;
  xgAway: number;
  picks: Record<Market, Pick>;
  /** Tekli seçenekler arasında ihtimali en yüksek olan (çifte şans hariç). */
  main: Pick;
  topScores: { home: number; away: number; p: number }[];
  lowSample: boolean;
}

/** Lig ortalamasına çekme gücü: kaç "sanal maç" eklenir. */
const PRIOR_GAMES = 3;
const MAX_GOALS = 10;

const MARKET_LABEL: Record<Market, string> = {
  "1": "Ev sahibi kazanır",
  X: "Beraberlik",
  "2": "Deplasman kazanır",
  "1X": "Ev sahibi kaybetmez",
  X2: "Deplasman kaybetmez",
  "2.5 Üst": "3 veya daha fazla gol",
  "2.5 Alt": "En fazla 2 gol",
  "KG Var": "İki takım da gol atar",
  "KG Yok": "En az bir takım gol atamaz",
};

function poissonPmf(lambda: number): number[] {
  const out = [Math.exp(-lambda)];
  for (let k = 1; k <= MAX_GOALS; k++) out.push((out[k - 1] * lambda) / k);
  return out;
}

const shrink = (sum: number, n: number, prior: number) => (sum + PRIOR_GAMES * prior) / (n + PRIOR_GAMES);
const clamp = (v: number) => Math.min(4, Math.max(0.2, v));

export function predict(home: StandingRow, away: StandingRow, table: StandingRow[]): Prediction | null {
  const totalPlayed = table.reduce((a, r) => a + r.played, 0);
  if (!totalPlayed || !home.played || !away.played) return null;

  let xgHome: number;
  let xgAway: number;
  if (home.home && away.away && table.every((r) => r.home && r.away)) {
    const homeGames = table.reduce((a, r) => a + r.home!.played, 0);
    const leagueHome = table.reduce((a, r) => a + r.home!.goalsFor, 0) / homeGames; // ev sahiplerinin maç başı golü
    const leagueAway = table.reduce((a, r) => a + r.away!.goalsFor, 0) / homeGames; // konukların maç başı golü
    const homeAttack = shrink(home.home.goalsFor, home.home.played, leagueHome);
    const homeDefence = shrink(home.home.goalsAgainst, home.home.played, leagueAway);
    const awayAttack = shrink(away.away.goalsFor, away.away.played, leagueAway);
    const awayDefence = shrink(away.away.goalsAgainst, away.away.played, leagueHome);
    xgHome = (homeAttack * awayDefence) / leagueHome;
    xgAway = (awayAttack * homeDefence) / leagueAway;
  } else {
    // İç saha / deplasman ayrımı yoksa genel ortalama + sabit ev avantajı.
    const leagueAvg = table.reduce((a, r) => a + r.goalsFor, 0) / totalPlayed;
    const att = (r: StandingRow) => shrink(r.goalsFor, r.played, leagueAvg);
    const def = (r: StandingRow) => shrink(r.goalsAgainst, r.played, leagueAvg);
    xgHome = ((att(home) * def(away)) / leagueAvg) * 1.1;
    xgAway = ((att(away) * def(home)) / leagueAvg) * 0.9;
  }
  xgHome = clamp(xgHome);
  xgAway = clamp(xgAway);

  const ph = poissonPmf(xgHome);
  const pa = poissonPmf(xgAway);
  let p1 = 0, px = 0, p2 = 0, over = 0, btts = 0;
  const scores: Prediction["topScores"] = [];
  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      const p = ph[h] * pa[a];
      if (h > a) p1 += p;
      else if (h === a) px += p;
      else p2 += p;
      if (h + a > 2.5) over += p;
      if (h > 0 && a > 0) btts += p;
      scores.push({ home: h, away: a, p });
    }
  }
  // MAX_GOALS üstünde kalan çok küçük olasılığı dağıtmak için normalize et.
  const total = p1 + px + p2;
  const probs: Record<Market, number> = {
    "1": p1 / total,
    X: px / total,
    "2": p2 / total,
    "1X": (p1 + px) / total,
    X2: (px + p2) / total,
    "2.5 Üst": over / total,
    "2.5 Alt": 1 - over / total,
    "KG Var": btts / total,
    "KG Yok": 1 - btts / total,
  };
  const picks = Object.fromEntries(
    (Object.keys(probs) as Market[]).map((m) => [m, { market: m, label: MARKET_LABEL[m], p: probs[m] }]),
  ) as Record<Market, Pick>;

  const singles: Market[] = ["1", "X", "2", "2.5 Üst", "2.5 Alt", "KG Var", "KG Yok"];
  const main = singles.map((m) => picks[m]).reduce((best, p) => (p.p > best.p ? p : best));

  return {
    xgHome,
    xgAway,
    picks,
    main,
    topScores: scores.sort((x, y) => y.p - x.p).slice(0, 3).map((s) => ({ ...s, p: s.p / total })),
    lowSample: Math.min(home.played, away.played) < 5,
  };
}

export const percent = (p: number) => `%${Math.round(p * 100)}`;
