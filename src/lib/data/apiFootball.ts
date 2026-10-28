/** https://www.api-football.com (v3) üzerinden gerçek veri. */
import { currentSeason } from "../date";
import { TRACKED_LEAGUES } from "../leagues";
import type { DataProvider, FormResult, League, Match, MatchStatus, StandingRow } from "../types";

const BASE = "https://v3.football.api-sports.io";

const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
const SCHEDULED = new Set(["NS", "TBD"]);

interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string; country: string; logo: string; season: number };
  teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } };
  goals: { home: number | null; away: number | null };
}

interface ApiStanding {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  form: string | null;
  all: ApiSplit;
  home: ApiSplit;
  away: ApiSplit;
}

interface ApiSplit {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: { for: number; against: number };
}

const split = (s: ApiSplit) => ({ played: s.played, goalsFor: s.goals.for, goalsAgainst: s.goals.against });

async function api<T>(path: string, params: Record<string, string | number>, revalidate: number): Promise<T[]> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`API-Football ${path}: HTTP ${res.status}`);
  const body = (await res.json()) as { errors: unknown; response: T[] };
  const errors = body.errors && typeof body.errors === "object" ? Object.values(body.errors) : [];
  if (errors.length) throw new Error(`API-Football ${path}: ${errors.join(", ")}`);
  return body.response;
}

function status(short: string): MatchStatus {
  if (FINISHED.has(short)) return "finished";
  if (LIVE.has(short)) return "live";
  if (SCHEDULED.has(short)) return "scheduled";
  return "other";
}

function toMatch(f: ApiFixture): Match {
  const tracked = TRACKED_LEAGUES.find((l) => l.id === String(f.league.id));
  const s = status(f.fixture.status.short);
  return {
    id: String(f.fixture.id),
    league: {
      id: String(f.league.id),
      name: tracked?.name ?? f.league.name,
      country: tracked?.country ?? f.league.country,
      season: f.league.season,
      logo: f.league.logo,
    },
    kickoff: f.fixture.date,
    status: s,
    home: { id: String(f.teams.home.id), name: f.teams.home.name, logo: f.teams.home.logo },
    away: { id: String(f.teams.away.id), name: f.teams.away.name, logo: f.teams.away.logo },
    score:
      s !== "scheduled" && f.goals.home !== null && f.goals.away !== null
        ? { home: f.goals.home, away: f.goals.away }
        : null,
  };
}

const trackedIds = new Set<string>(TRACKED_LEAGUES.map((l) => l.id));

function leagueFromConfig(id: string): League | null {
  const l = TRACKED_LEAGUES.find((x) => x.id === id);
  return l ? { id: l.id, name: l.name, country: l.country, season: currentSeason() } : null;
}

export const apiFootballProvider: DataProvider = {
  isDemo: false,

  async getLeagues() {
    return TRACKED_LEAGUES.map((l) => leagueFromConfig(l.id)!);
  },

  async getLeague(id) {
    return leagueFromConfig(id);
  },

  async getMatchesByDate(date) {
    const list = await api<ApiFixture>("/fixtures", { date, timezone: "Europe/Istanbul" }, 300);
    return list.filter((f) => trackedIds.has(String(f.league.id))).map(toMatch);
  },

  async getMatch(id) {
    const [f] = await api<ApiFixture>("/fixtures", { id }, 300);
    return f ? toMatch(f) : null;
  },

  async getTeam(id) {
    const [t] = await api<{ team: { id: number; name: string; logo: string } }>("/teams", { id }, 86400);
    return t ? { id: String(t.team.id), name: t.team.name, logo: t.team.logo } : null;
  },

  async getTeamMatches(teamId, last) {
    const list = await api<ApiFixture>("/fixtures", { team: teamId, last }, 3600);
    return list.map(toMatch).filter((m) => m.status === "finished");
  },

  async getHeadToHead(a, b, last) {
    const list = await api<ApiFixture>("/fixtures/headtohead", { h2h: `${a}-${b}`, last }, 3600);
    return list
      .map(toMatch)
      .filter((m) => m.status === "finished")
      .sort((x, y) => y.kickoff.localeCompare(x.kickoff));
  },

  async getLeagueResults(leagueId) {
    const list = await api<ApiFixture>(
      "/fixtures",
      { league: leagueId, season: currentSeason(), status: "FT-AET-PEN" },
      3600,
    );
    return list.map(toMatch);
  },

  async getStandings(leagueId) {
    const res = await api<{ league: { standings: ApiStanding[][] } }>(
      "/standings",
      { league: leagueId, season: currentSeason() },
      3600,
    );
    // Gruplu turnuvalarda (ör. eski format ŞL) tüm grupları tek listede birleştir.
    const groups = res[0]?.league.standings ?? [];
    return groups.flat().map(
      (s): StandingRow => ({
        rank: s.rank,
        team: { id: String(s.team.id), name: s.team.name, logo: s.team.logo },
        played: s.all.played,
        won: s.all.win,
        drawn: s.all.draw,
        lost: s.all.lose,
        goalsFor: s.all.goals.for,
        goalsAgainst: s.all.goals.against,
        points: s.points,
        // API "WWDLW" formatında en yeniyi solda verir; biz en yeniyi sağda tutarız.
        form: (s.form ?? "").split("").filter((c): c is FormResult => c === "W" || c === "D" || c === "L").reverse(),
        home: split(s.home),
        away: split(s.away),
      }),
    );
  },
};
