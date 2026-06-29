"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Opt = { text: string; isCorrect: boolean };
type Q = { text: string; options: Opt[] };

const blankQ = (): Q => ({ text: "", options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }] });

export default function QuizBuilder({ courseId, backHref }: { courseId: string; backHref: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"POLL" | "QUIZ">("POLL");
  const [questions, setQuestions] = useState<Q[]>([blankQ()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (qi: number, fn: (q: Q) => Q) => setQuestions((qs) => qs.map((q, i) => (i === qi ? fn(q) : q)));

  const save = async () => {
    setSaving(true); setError(null);
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, title, kind, questions }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (d.ok) router.push(backHref);
    else setError(d.error || "Could not save");
  };

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <label className="label">Title</label>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Week 1 — Quick check" />
        <div className="mt-4 flex gap-2">
          {(["POLL", "QUIZ"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${kind === k ? "bg-pine text-paper" : "border border-line-2 text-ink"}`}>
              {k === "POLL" ? "Poll (no right answer)" : "Quiz (mark correct answers)"}
            </button>
          ))}
        </div>
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="eyebrow">Question {qi + 1}</span>
            {questions.length > 1 && (
              <button onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))} className="text-xs text-rust hover:underline">Remove</button>
            )}
          </div>
          <input className="field" value={q.text} onChange={(e) => update(qi, (qq) => ({ ...qq, text: e.target.value }))} placeholder="Question text" />
          <div className="mt-3 space-y-2">
            {q.options.map((o, oi) => (
              <div key={oi} className="flex items-center gap-2">
                {kind === "QUIZ" && (
                  <label className="flex items-center gap-1 text-xs text-ink-soft" title="Mark correct">
                    <input type="radio" name={`correct-${qi}`} checked={o.isCorrect}
                      onChange={() => update(qi, (qq) => ({ ...qq, options: qq.options.map((oo, j) => ({ ...oo, isCorrect: j === oi })) }))} />
                    correct
                  </label>
                )}
                <input className="field" value={o.text}
                  onChange={(e) => update(qi, (qq) => ({ ...qq, options: qq.options.map((oo, j) => (j === oi ? { ...oo, text: e.target.value } : oo)) }))}
                  placeholder={`Option ${oi + 1}`} />
                {q.options.length > 2 && (
                  <button onClick={() => update(qi, (qq) => ({ ...qq, options: qq.options.filter((_, j) => j !== oi) }))} className="text-ink-soft hover:text-rust">✕</button>
                )}
              </div>
            ))}
            <button onClick={() => update(qi, (qq) => ({ ...qq, options: [...qq.options, { text: "", isCorrect: false }] }))}
              className="text-sm font-medium text-pine hover:underline">+ Add option</button>
          </div>
        </div>
      ))}

      {error && <p className="rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setQuestions((qs) => [...qs, blankQ()])} className="btn btn-outline">+ Add question</button>
        <button onClick={save} disabled={saving} className="btn btn-primary disabled:opacity-50">{saving ? "Saving…" : "Save quiz / poll"}</button>
        <button onClick={() => router.push(backHref)} className="btn btn-ghost text-ink-soft">Cancel</button>
      </div>
    </div>
  );
}
