import Link from "next/link";
import type { FormResult, Team } from "@/lib/types";

const FORM_LABEL: Record<FormResult, { text: string; cls: string; title: string }> = {
  W: { text: "G", cls: "bg-win text-white", title: "Galibiyet" },
  D: { text: "B", cls: "bg-draw text-black", title: "Beraberlik" },
  L: { text: "M", cls: "bg-loss text-white", title: "Mağlubiyet" },
};

export function FormBadges({ form, size = "md" }: { form: FormResult[]; size?: "sm" | "md" }) {
  if (!form.length) return <span className="text-xs text-muted">—</span>;
  const dim = size === "sm" ? "h-4 w-4 text-[10px]" : "h-6 w-6 text-xs";
  return (
    <span className="inline-flex gap-0.5" aria-label="Son maçlar, en yenisi sağda">
      {form.map((r, i) => (
        <span
          key={i}
          title={FORM_LABEL[r].title}
          className={`${dim} ${FORM_LABEL[r].cls} inline-flex items-center justify-center rounded font-bold`}
        >
          {FORM_LABEL[r].text}
        </span>
      ))}
    </span>
  );
}

export function TeamLogo({ team, size = 20 }: { team: Team; size?: number }) {
  if (team.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={team.logo} alt="" width={size} height={size} className="shrink-0 object-contain" />;
  }
  const initials = team.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toLocaleUpperCase("tr");
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-panel-2 font-bold text-muted ring-1 ring-line"
    >
      {initials}
    </span>
  );
}

export function TeamLink({ team, size = 20, className = "" }: { team: Team; size?: number; className?: string }) {
  return (
    <Link href={`/takim/${team.id}`} className={`inline-flex min-w-0 items-center gap-2 hover:text-accent ${className}`}>
      <TeamLogo team={team} size={size} />
      <span className="truncate">{team.name}</span>
    </Link>
  );
}

export function Card({ title, children, right }: { title?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-panel">
      {title && (
        <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{title}</h2>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/** İki takımı tek satırda karşılaştıran çubuk. `higherIsBetter` yalnızca vurgu rengini belirler. */
export function CompareRow({
  label,
  home,
  away,
  format = (v) => String(v),
  higherIsBetter = true,
  max,
}: {
  label: string;
  home: number;
  away: number;
  format?: (v: number) => string;
  higherIsBetter?: boolean;
  max?: number;
}) {
  const scale = max ?? Math.max(home, away, 0.0001);
  const homeBetter = higherIsBetter ? home > away : home < away;
  const awayBetter = higherIsBetter ? away > home : away < home;
  return (
    <div className="py-2">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className={homeBetter ? "font-bold text-accent" : ""}>{format(home)}</span>
        <span className="text-xs text-muted">{label}</span>
        <span className={awayBetter ? "font-bold text-accent" : ""}>{format(away)}</span>
      </div>
      <div className="flex gap-1">
        <div className="flex h-1.5 flex-1 justify-end overflow-hidden rounded bg-panel-2">
          <div className={homeBetter ? "bg-accent" : "bg-muted/50"} style={{ width: `${(home / scale) * 100}%` }} />
        </div>
        <div className="flex h-1.5 flex-1 overflow-hidden rounded bg-panel-2">
          <div className={awayBetter ? "bg-accent" : "bg-muted/50"} style={{ width: `${(away / scale) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel-2 px-3 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

export function DemoBanner() {
  return (
    <div className="border-b border-draw/40 bg-draw/10 px-4 py-2 text-center text-xs text-draw">
      <strong>DEMO MODU:</strong> Takım isimleri gerçek, ancak skorlar ve istatistikler rastgele üretilmiştir.
      Gerçek veri için <code>API_FOOTBALL_KEY</code> tanımlayın.
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-loss/40 bg-loss/10 p-4 text-sm text-loss">
      Veri alınamadı: {message}
    </div>
  );
}

export const pct = (v: number) => `%${v}`;
export const dec = (v: number) => v.toFixed(2);

/** Öneriyi ihtimaline göre renklendirir: %65+ yeşil, %55+ sarı, altı gri. */
export function PickChip({ market, p, small = false }: { market: string; p: number; small?: boolean }) {
  const cls = p >= 0.65 ? "border-accent/50 bg-accent/15 text-accent" : p >= 0.55 ? "border-draw/50 bg-draw/10 text-draw" : "border-line bg-panel-2 text-muted";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border font-semibold whitespace-nowrap ${cls} ${small ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-sm"}`}>
      {market}
      <span className="font-normal opacity-80">%{Math.round(p * 100)}</span>
    </span>
  );
}
