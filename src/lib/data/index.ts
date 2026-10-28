import { API_FOOTBALL_LEAGUES, API_FOOTBALL_ONLY } from "../leagues";
import type { DataProvider } from "../types";
import { createApiFootballProvider } from "./apiFootball";
import { demoProvider } from "./demo";
import { footballDataProvider } from "./footballData";

/** Kimliğin önekine ("fd-", "af-") göre doğru kaynağa yönlendirir. */
function combine(providers: Record<string, DataProvider>): DataProvider {
  const pick = (id: string) => providers[id.slice(0, 3)] ?? Object.values(providers)[0];
  const all = Object.values(providers);
  return {
    isDemo: false,
    hasStats: (leagueId) => pick(leagueId).hasStats(leagueId),
    getLeagues: async () => (await Promise.all(all.map((p) => p.getLeagues()))).flat(),
    getLeague: (id) => pick(id).getLeague(id),
    async getMatchesByDate(date) {
      const results = await Promise.allSettled(all.map((p) => p.getMatchesByDate(date)));
      const ok = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
      const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
      // Bir kaynak çökerse diğerinin maçlarını yine göster; ikisi de boşsa hatayı ilet.
      if (failed && ok.length === 0) throw failed.reason;
      return ok;
    },
    getMatch: (id) => pick(id).getMatch(id),
    getTeam: (id) => pick(id).getTeam(id),
    getTeamMatches: (id, last) => pick(id).getTeamMatches(id, last),
    getHeadToHead: (match, last) => pick(match.id).getHeadToHead(match, last),
    getStandings: (id) => pick(id).getStandings(id),
    getLeagueResults: (id) => pick(id).getLeagueResults(id),
  };
}

export function getProvider(): DataProvider {
  const fd = process.env.FOOTBALL_DATA_KEY;
  const af = process.env.API_FOOTBALL_KEY;
  const limited = process.env.API_FOOTBALL_PAID !== "1";
  if (fd && af) {
    return combine({
      "fd-": footballDataProvider,
      "af-": createApiFootballProvider({ leagues: API_FOOTBALL_ONLY, limited }),
    });
  }
  if (fd) return footballDataProvider;
  if (af) return createApiFootballProvider({ leagues: API_FOOTBALL_LEAGUES.map((l) => l.id), limited });
  return demoProvider;
}
