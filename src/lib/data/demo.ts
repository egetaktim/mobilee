/**
 * Anahtar olmadan çalışmak için uydurma veri üretir. Takım isimleri gerçektir
 * ama tüm skorlar rastgele üretilir; site bu modda "DEMO" uyarısı gösterir.
 */
import { addDays, currentSeason, toLocalDate } from "../date";
import type { DataProvider, FormResult, League, Match, StandingRow, Team } from "../types";

const DEMO_LEAGUES: { id: string; name: string; country: string; teams: string[] }[] = [
  {
    id: "demo-tr",
    name: "Süper Lig",
    country: "Türkiye",
    teams: [
      "Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor", "Başakşehir", "Samsunspor",
      "Göztepe", "Kasımpaşa", "Eyüpspor", "Alanyaspor", "Antalyaspor", "Konyaspor",
      "Kayserispor", "Gaziantep FK", "Çaykur Rizespor", "Gençlerbirliği", "Kocaelispor", "Amed SFK",
    ],
  },
  {
    id: "demo-en",
    name: "Premier League",
    country: "İngiltere",
    teams: [
      "Arsenal", "Manchester City", "Liverpool", "Chelsea", "Newcastle", "Aston Villa",
      "Tottenham", "Manchester United", "Brighton", "Crystal Palace", "Brentford", "Fulham",
      "Bournemouth", "Nottingham Forest", "West Ham", "Everton", "Wolves", "Leeds", "Sunderland", "Burnley",
    ],
  },
  {
    id: "demo-es",
    name: "La Liga",
    country: "İspanya",
    teams: [
      "Real Madrid", "Barcelona", "Atlético Madrid", "Athletic Club", "Villarreal", "Real Sociedad",
      "Real Betis", "Sevilla", "Girona", "Osasuna", "Celta Vigo", "Valencia",
      "Rayo Vallecano", "Getafe", "Mallorca", "Espanyol", "Alavés", "Elche", "Levante", "Real Oviedo",
    ],
  },
];

const KICKOFF_HOURS = ["14:30", "17:00", "19:00", "20:00", "21:30"];

function slug(s: string) {
  return s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function poisson(lambda: number, rand: () => number) {
  const l = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > l);
  return k - 1;
}

/** Çember yöntemiyle çift devreli fikstür: her tur için [ev, deplasman] indeks çiftleri. */
function doubleRoundRobin(n: number): [number, number][][] {
  const idx = Array.from({ length: n }, (_, i) => i);
  const rounds: [number, number][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [number, number][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = idx[i];
      const b = idx[n - 1 - i];
      pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    idx.splice(1, 0, idx.pop()!);
  }
  return [...rounds, ...rounds.map((pairs) => pairs.map(([a, b]) => [b, a] as [number, number]))];
}

interface DemoDb {
  leagues: League[];
  teams: Map<string, Team>;
  teamLeague: Map<string, string>;
  matches: Match[]; // eskiden yeniye
}

let cache: { key: string; db: DemoDb } | null = null;

function buildDb(): DemoDb {
  const now = new Date();
  const season = currentSeason(now);
  const key = `${season}-${toLocalDate(now)}-${now.getUTCHours()}`;
  if (cache?.key === key) return cache.db;

  const leagues: League[] = [];
  const teams = new Map<string, Team>();
  const teamLeague = new Map<string, string>();
  const matches: Match[] = [];

  for (const def of DEMO_LEAGUES) {
    const league: League = { id: def.id, name: def.name, country: def.country, season };
    leagues.push(league);
    const leagueTeams = def.teams.map((name) => {
      const t: Team = { id: `${def.id}-${slug(name)}`, name };
      teams.set(t.id, t);
      teamLeague.set(t.id, def.id);
      return t;
    });
    // Listede üstte olan takım daha güçlü; her sezon biraz oynasın.
    for (const s of [season - 2, season - 1, season]) {
      const rand = rng(hash(`${def.id}-${s}`));
      const strength = leagueTeams.map((_, i) => 1.5 - (i / leagueTeams.length) * 0.8 + (rand() - 0.5) * 0.3);
      const start = `${s}-08-14`;
      doubleRoundRobin(leagueTeams.length).forEach((pairs, round) => {
        pairs.forEach(([h, a], k) => {
          const date = addDays(start, round * 7 + (k % 7));
          const hour = KICKOFF_HOURS[hash(`${def.id}${s}${round}${k}`) % KICKOFF_HOURS.length];
          const kickoff = `${date}T${hour}:00+03:00`;
          const id = `${def.id}-${s}-${round + 1}-${k + 1}`;
          const finished = new Date(kickoff).getTime() + 2 * 3600_000 < now.getTime();
          const mrand = rng(hash(id));
          const ratio = strength[h] / strength[a];
          matches.push({
            id,
            league: { ...league, season: s },
            kickoff,
            status: finished ? "finished" : "scheduled",
            home: leagueTeams[h],
            away: leagueTeams[a],
            score: finished
              ? { home: poisson(1.45 * ratio ** 1.1, mrand), away: poisson(1.1 / ratio ** 1.1, mrand) }
              : null,
          });
        });
      });
    }
  }

  matches.sort((x, y) => x.kickoff.localeCompare(y.kickoff));
  const db = { leagues, teams, teamLeague, matches };
  cache = { key, db };
  return db;
}

const newestFirst = (list: Match[]) => [...list].reverse();

export const demoProvider: DataProvider = {
  isDemo: true,

  async getLeagues() {
    return buildDb().leagues;
  },

  async getLeague(id) {
    return buildDb().leagues.find((l) => l.id === id) ?? null;
  },

  async getMatchesByDate(date) {
    return buildDb().matches.filter((m) => toLocalDate(m.kickoff) === date);
  },

  async getMatch(id) {
    return buildDb().matches.find((m) => m.id === id) ?? null;
  },

  async getTeam(id) {
    return buildDb().teams.get(id) ?? null;
  },

  async getTeamMatches(teamId, last) {
    return newestFirst(
      buildDb().matches.filter((m) => m.status === "finished" && (m.home.id === teamId || m.away.id === teamId)),
    ).slice(0, last);
  },

  async getHeadToHead(a, b, last) {
    return newestFirst(
      buildDb().matches.filter(
        (m) =>
          m.status === "finished" &&
          ((m.home.id === a && m.away.id === b) || (m.home.id === b && m.away.id === a)),
      ),
    ).slice(0, last);
  },

  async getLeagueResults(leagueId) {
    const db = buildDb();
    const season = db.leagues.find((l) => l.id === leagueId)?.season;
    return db.matches.filter((m) => m.league.id === leagueId && m.league.season === season && m.status === "finished");
  },

  async getStandings(leagueId) {
    const db = buildDb();
    const results = await this.getLeagueResults(leagueId);
    const rows = new Map<string, StandingRow>();
    for (const [teamId, lid] of db.teamLeague) {
      if (lid !== leagueId) continue;
      rows.set(teamId, {
        rank: 0, team: db.teams.get(teamId)!, played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, points: 0, form: [],
        home: { played: 0, goalsFor: 0, goalsAgainst: 0 },
        away: { played: 0, goalsFor: 0, goalsAgainst: 0 },
      });
    }
    const apply = (row: StandingRow, gf: number, ga: number, venue: "home" | "away") => {
      const r: FormResult = gf > ga ? "W" : gf < ga ? "L" : "D";
      const split = row[venue]!;
      split.played++;
      split.goalsFor += gf;
      split.goalsAgainst += ga;
      row.played++;
      row.goalsFor += gf;
      row.goalsAgainst += ga;
      if (r === "W") (row.won++, (row.points += 3));
      else if (r === "D") (row.drawn++, row.points++);
      else row.lost++;
      row.form = [...row.form, r].slice(-5);
    };
    for (const m of results) {
      apply(rows.get(m.home.id)!, m.score!.home, m.score!.away, "home");
      apply(rows.get(m.away.id)!, m.score!.away, m.score!.home, "away");
    }
    return [...rows.values()]
      .sort(
        (x, y) =>
          y.points - x.points ||
          y.goalsFor - y.goalsAgainst - (x.goalsFor - x.goalsAgainst) ||
          y.goalsFor - x.goalsFor ||
          x.team.name.localeCompare(y.team.name, "tr"),
      )
      .map((row, i) => ({ ...row, rank: i + 1 }));
  },
};
