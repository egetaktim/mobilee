export type MatchStatus = "scheduled" | "live" | "finished" | "other";

export interface Team {
  id: string;
  name: string;
  logo?: string;
}

export interface League {
  id: string;
  name: string;
  country: string;
  season: number;
  logo?: string;
}

export interface Match {
  id: string;
  league: League;
  kickoff: string; // ISO 8601
  status: MatchStatus;
  home: Team;
  away: Team;
  score: { home: number; away: number } | null;
}

/** Son maçtan önceki sonuç en solda, en son maç en sağda. */
export type FormResult = "W" | "D" | "L";

export interface VenueSplit {
  played: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface StandingRow {
  rank: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: FormResult[];
  home?: VenueSplit;
  away?: VenueSplit;
}

export interface DataProvider {
  readonly isDemo: boolean;
  /** Bu lig için form, istatistik ve öneri hesaplanabiliyor mu (ör. ücretsiz plan kısıtı)? */
  hasStats(leagueId: string): boolean;
  getLeagues(): Promise<League[]>;
  getLeague(id: string): Promise<League | null>;
  getMatchesByDate(date: string): Promise<Match[]>;
  getMatch(id: string): Promise<Match | null>;
  getTeam(id: string): Promise<Team | null>;
  /** Takımın oynanmış son maçları, yeniden eskiye. */
  getTeamMatches(teamId: string, last: number): Promise<Match[]>;
  /** Maçtaki iki takımın birbirleriyle oynadığı maçlar, yeniden eskiye. */
  getHeadToHead(match: Match, last: number): Promise<Match[]>;
  getStandings(leagueId: string): Promise<StandingRow[]>;
  /** Ligin bu sezon oynanmış tüm maçları. */
  getLeagueResults(leagueId: string): Promise<Match[]>;
}
