import Link from "next/link";
import { formatDate } from "@/lib/date";
import { resultFor } from "@/lib/stats";
import type { Match } from "@/lib/types";
import { TeamLogo } from "./ui";

const RESULT_CLS = { W: "text-win", D: "text-draw", L: "text-loss" } as const;

/** Oynanmış maç listesi. `perspective` verilirse o takımın sonucuna göre renklenir. */
export function MatchResults({ matches, perspective }: { matches: Match[]; perspective?: string }) {
  if (!matches.length) return <p className="text-sm text-muted">Kayıtlı maç yok.</p>;
  return (
    <ul className="divide-y divide-line text-sm">
      {matches.map((m) => {
        const r = perspective ? resultFor(m, perspective) : null;
        return (
          <li key={m.id}>
            <Link href={`/mac/${m.id}`} className="grid grid-cols-[4rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-2 hover:bg-panel-2">
              <span className="text-xs text-muted">{formatDate(m.kickoff, { year: "2-digit" })}</span>
              <span className="flex min-w-0 items-center justify-end gap-2 text-right">
                <span className={`truncate ${m.home.id === perspective ? "font-semibold" : ""}`}>{m.home.name}</span>
                <TeamLogo team={m.home} size={16} />
              </span>
              <span className={`min-w-12 rounded bg-panel-2 px-2 py-0.5 text-center font-mono font-bold ${r ? RESULT_CLS[r] : ""}`}>
                {m.score ? `${m.score.home}-${m.score.away}` : "-"}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <TeamLogo team={m.away} size={16} />
                <span className={`truncate ${m.away.id === perspective ? "font-semibold" : ""}`}>{m.away.name}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
