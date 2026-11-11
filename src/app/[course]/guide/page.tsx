import { AlertTriangle } from "lucide-react";
import { GuideActions } from "@/components/guide/GuideActions";
import { Card, Eyebrow } from "@/components/ui";
import { getCourse } from "@/lib/content/server";
import { MathText } from "@/components/ui/Markdown";

export const metadata = { title: "Revision guide" };

export default async function GuidePage({ params }: { params: Promise<{ course: string }> }) {
  const c = getCourse((await params).course);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{c.code} · Revision guide</Eyebrow>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">{c.title} on a few pages</h1>
          <p className="mt-2 max-w-2xl text-ink-2">The night-before sheet: every module&apos;s one-minute summary, traps, terms, formulas and the answer examiners want.</p>
        </div>
        <GuideActions courseId={c.id} label={`${c.code} ${c.title}`} />
      </div>

      <Card className="bg-ink p-6 text-paper">
        <h2 className="font-display text-xl font-semibold">The 3-beat answer</h2>
        <p className="mt-1 text-sm opacity-75">Examiners reward structure. Every answer, about 30 seconds:</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["1 · Claim", "One sentence: what it is or does. State the rule directly."],
            ["2 · Mechanism", "How it works: the maths, the steps, the data structures."],
            ["3 · Trade-off", "When it fails, what it costs, or why the alternative breaks."],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm">
              <b className="mb-1 block text-xs tracking-wider text-[#FFD84D] uppercase">{k}</b>
              {v}
            </div>
          ))}
        </div>
      </Card>

      {c.formulas.length > 0 && (
        <Card className="p-6 break-inside-avoid">
          <h2 className="font-display text-xl font-semibold">Formulas to know cold</h2>
          <dl className="mt-3 divide-y divide-line">
            {c.formulas.map((f) => (
              <div key={f.name} className="grid gap-1 py-2.5 sm:grid-cols-[220px_1fr]">
                <dt className="text-sm font-semibold">{f.name}</dt>
                <dd className="font-mono text-[13px] text-accent">{f.expr}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {c.modules.map((m, i) => (
          <Card key={m.id} className="space-y-3 p-6 break-inside-avoid">
            <div>
              <Eyebrow>Module {i + 1}</Eyebrow>
              <h2 className="mt-1 font-display text-xl leading-snug font-semibold">{m.title}</h2>
            </div>
            {m.recap && <p className="text-[14.5px] leading-relaxed">{m.recap}</p>}
            {m.traps.length > 0 && (
              <ul className="space-y-1 text-[13.5px] text-ink-2">
                {m.traps.map((t) => (
                  <li key={t} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-bad" /> {t}
                  </li>
                ))}
              </ul>
            )}
            {m.terms.length > 0 && (
              <dl className="grid gap-x-3 gap-y-1 text-[13px] sm:grid-cols-[130px_1fr]">
                {m.terms.map((t) => (
                  <div key={t.term} className="contents">
                    <dt className="font-semibold">{t.term}</dt>
                    <dd className="text-ink-2">{t.definition}</dd>
                  </div>
                ))}
              </dl>
            )}
            {m.checkpoint && (
              <div className="rounded-xl bg-sunk p-4 text-[13.5px]">
                <p className="font-semibold">Likely question: {m.checkpoint.question}</p>
                <p className="mt-1.5 leading-relaxed text-ink-2"><MathText>{m.checkpoint.idealAnswer}</MathText></p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
