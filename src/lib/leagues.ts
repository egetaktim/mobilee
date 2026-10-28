/** football-data.org yarışma kodları (ücretsiz planda bu sezon dahil tam veri). */
export const FOOTBALL_DATA_COMPETITIONS = [
  { code: "PL", name: "Premier League", country: "İngiltere" },
  { code: "ELC", name: "Championship", country: "İngiltere" },
  { code: "PD", name: "La Liga", country: "İspanya" },
  { code: "SA", name: "Serie A", country: "İtalya" },
  { code: "BL1", name: "Bundesliga", country: "Almanya" },
  { code: "FL1", name: "Ligue 1", country: "Fransa" },
  { code: "PPL", name: "Primeira Liga", country: "Portekiz" },
  { code: "DED", name: "Eredivisie", country: "Hollanda" },
  { code: "CL", name: "Şampiyonlar Ligi", country: "Avrupa" },
] as const;

/** API-Football lig kimlikleri. */
export const API_FOOTBALL_LEAGUES = [
  { id: "203", name: "Süper Lig", country: "Türkiye" },
  { id: "204", name: "1. Lig", country: "Türkiye" },
  { id: "39", name: "Premier League", country: "İngiltere" },
  { id: "140", name: "La Liga", country: "İspanya" },
  { id: "135", name: "Serie A", country: "İtalya" },
  { id: "78", name: "Bundesliga", country: "Almanya" },
  { id: "61", name: "Ligue 1", country: "Fransa" },
  { id: "94", name: "Primeira Liga", country: "Portekiz" },
  { id: "2", name: "Şampiyonlar Ligi", country: "Avrupa" },
  { id: "3", name: "Avrupa Ligi", country: "Avrupa" },
  { id: "848", name: "Konferans Ligi", country: "Avrupa" },
] as const;

/** football-data.org da tanımlıyken API-Football'dan yalnızca bunlar alınır. */
export const API_FOOTBALL_ONLY = ["203", "204", "3", "848"];
