/** https://www.football-data.org (v4). Ücretsiz plan: 10 istek/dakika, bu sezon dahil. */
import { addDays, toLocalDate } from "../date";
import { FOOTBALL_DATA_COMPETITIONS } from "../leagues";
import { buildStandings } from "../standings";
import type { DataProvider, League, Match, MatchStatus } from "../types";

const BASE = "https://api.football-data.org/v4";
const P = "fd-";
const raw = (id: string) => id.replace(P, "");

interface FdTeam {
  id: number;
  name: string;
  shortName?: string;
  crest?: string;
}

interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  competition: { id: number; code: string; name: string; emblem?: string };
  season: { startDate: string };
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: { fullTime: { home: number | null; away: number | null } };
}

async function api<T>(path: string, params: Record<string, string | number>, revalidate: number, retry = true): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_KEY! },
    next: { revalidate },
  });
  if (res.status === 429 && retry) {
    // Dakikalık limit doldu: sayacın sıfırlanmasını bekleyip bir kez daha dene.
    const wait = Math.min(Number(res.headers.get("X-RequestCounter-Reset")) || 10, 60);
    await new Promise((r) => setTimeout(r, wait * 1000));
    return api<T>(path, params, revalidate, false);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(`football-data.org ${path}: ${body.message ?? `HTTP ${res.status}`}`);
  }
  return (await res.json()) as T;
}

const STATUS: Record<string, MatchStatus> = {
  FINISHED: "finished",
  AWARDED: "finished",
  IN_PLAY: "live",
  PAUSED: "live",
  LIVE: "live",
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
};

const codes = new Set<string>(FOOTBALL_DATA_COMPETITIONS.map((c) => c.code));

function team(t: FdTeam) {
  return { id: P + t.id, name: t.shortName || t.name, logo: t.crest };
}

function toMatch(m: FdMatch): Match {
  const c = FOOTBALL_DATA_COMPETITIONS.find((x) => x.code === m.competition.code);
  const status = STATUS[m.status] ?? "other";
  const { home, away } = m.score.fullTime;
  return {
    id: P + m.id,
    league: {
      id: P + m.competition.code,
      name: c?.name ?? m.competition.name,
      country: c?.country ?? "",
      season: Number(m.season.startDate.slice(0, 4)),
      logo: m.competition.emblem,
    },
    kickoff: m.utcDate,
    status,
    home: team(m.homeTeam),
    away: team(m.awayTeam),
    score: status !== "scheduled" && home !== null && away !== null ? { home, away } : null,
  };
}

const newestFirst = (list: Match[]) => list.sort((a, b) => b.kickoff.localeCompare(a.kickoff));

function league(id: string): League | null {
  const c = FOOTBALL_DATA_COMPETITIONS.find((x) => x.code === raw(id));
  const now = toLocalDate(new Date());
  const [y, mo] = now.split("-").map(Number);
  return c ? { id: P + c.code, name: c.name, country: c.country, season: mo >= 7 ? y : y - 1 } : null;
}

export const footballDataProvider: DataProvider = {
  isDemo: false,
  hasStats: () => true,

  async getLeagues() {
    return FOOTBALL_DATA_COMPETITIONS.map((c) => league(c.code)!);
  },

  async getLeague(id) {
    return league(id);
  },

  async getMatchesByDate(date) {
    // API tarihleri UTC'dir; İstanbul gününü kapsamak için bir gün öncesini de al.
    const { matches } = await api<{ matches: FdMatch[] }>(
      "/matches",
      { dateFrom: addDays(date, -1), dateTo: addDays(date, 1) },
      300,
    );
    return matches
      .filter((m) => codes.has(m.competition.code))
      .map(toMatch)
      .filter((m) => toLocalDate(m.kickoff) === date);
  },

  async getMatch(id) {
    try {
      return toMatch(await api<FdMatch>(`/matches/${raw(id)}`, {}, 300));
    } catch {
      return null;
    }
  },

  async getTeam(id) {
    try {
      return team(await api<FdTeam>(`/teams/${raw(id)}`, {}, 86400));
    } catch {
      return null;
    }
  },

  async getTeamMatches(teamId, last) {
    const { matches } = await api<{ matches: FdMatch[] }>(
      `/teams/${raw(teamId)}/matches`,
      { status: "FINISHED", limit: last },
      3600,
    );
    return newestFirst(matches.map(toMatch)).slice(0, last);
  },

  async getHeadToHead(match, last) {
    const { matches } = await api<{ matches: FdMatch[] }>(`/matches/${raw(match.id)}/head2head`, { limit: last }, 86400);
    return newestFirst(matches.map(toMatch).filter((m) => m.status === "finished"));
  },

  async getLeagueResults(leagueId) {
    const { matches } = await api<{ matches: FdMatch[] }>(
      `/competitions/${raw(leagueId)}/matches`,
      { status: "FINISHED" },
      1800,
    );
    return matches.map(toMatch);
  },

  async getStandings(leagueId) {
    // Resmi tablo ücretsiz planda form ve iç saha/deplasman ayrımı içermediği için maçlardan hesaplanır.
    return buildStandings(await this.getLeagueResults(leagueId));
  },
};
