"use client";

import { useState, useEffect, useCallback } from "react";
import { useDataChannel } from "@livekit/components-react";

type ListItem = { id: string; title: string; kind: string; questions: number };
type AnswerQuiz = { id: string; title: string; kind: string; questions: { id: string; text: string; options: { id: string; text: string }[] }[] };
type Results = {
  id: string; title: string; kind: string; responders: number;
  scores: { correct: number; total: number; students: number } | null;
  questions: { id: string; text: string; options: { id: string; text: string; isCorrect: boolean; count: number }[] }[];
};

const enc = new TextEncoder();
const dec = new TextDecoder();

export default function QuizLayer({ sessionId, isTeacher }: { sessionId: string; isTeacher: boolean }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<ListItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);

  const [quiz, setQuiz] = useState<AnswerQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const loadStudentQuiz = useCallback(async (id: string) => {
    const d = await fetch(`/api/quiz/${id}`).then((r) => r.json()).catch(() => null);
    if (d?.id) { setQuiz(d); setAnswers({}); setSubmitted(false); }
  }, []);

  const { send } = useDataChannel("quiz", (msg) => {
    try {
      const d = JSON.parse(dec.decode(msg.payload));
      if (!isTeacher) {
        if (d.action === "open" && d.quizId) loadStudentQuiz(d.quizId);
        if (d.action === "close") { setQuiz(null); setAnswers({}); setSubmitted(false); }
      }
    } catch {}
  });
  const broadcast = useCallback(
    (obj: Record<string, unknown>) => send(enc.encode(JSON.stringify(obj)), { reliable: true }),
    [send]
  );

  useEffect(() => {
    if (isTeacher && open) fetch(`/api/quiz/list?session=${sessionId}`).then((r) => r.json()).then((d) => setList(d.quizzes || [])).catch(() => {});
  }, [isTeacher, open, sessionId]);

  useEffect(() => {
    if (!isTeacher || !activeId) return;
    let on = true;
    const tick = () => fetch(`/api/quiz/${activeId}/results`).then((r) => r.json()).then((d) => { if (on) setResults(d); }).catch(() => {});
    tick();
    const iv = setInterval(tick, 3000);
    return () => { on = false; clearInterval(iv); };
  }, [isTeacher, activeId]);

  const startQuiz = (id: string) => { setActiveId(id); setResults(null); setOpen(false); broadcast({ action: "open", quizId: id }); };
  const endQuiz = () => { broadcast({ action: "close" }); setActiveId(null); setResults(null); };

  const submit = async () => {
    if (!quiz) return;
    await fetch(`/api/quiz/${quiz.id}/respond`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })) }),
    });
    setSubmitted(true);
  };

  // ---------- HOST ----------
  if (isTeacher) {
    return (
      <>
        <button
          onClick={() => setOpen((v) => !v)}
          className="fixed bottom-4 right-4 z-40 rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-pine-900 shadow-lg hover:brightness-105"
        >
          📋 Quiz / Poll
        </button>

        {open && !activeId && (
          <div className="card fixed bottom-20 right-4 z-40 max-h-[60vh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto p-4 text-ink">
            <div className="mb-2 flex items-center justify-between">
              <p className="eyebrow">Start a quiz / poll</p>
              <button onClick={() => setOpen(false)} className="text-ink-soft hover:text-ink">✕</button>
            </div>
            {list.length === 0 ? (
              <p className="text-sm text-ink-soft">None prepared yet. Create one on the course page (Quizzes &amp; polls).</p>
            ) : (
              <ul className="space-y-2">
                {list.map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-2 rounded-lg border border-line p-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{q.title}</p>
                      <p className="text-xs text-ink-soft">{q.kind === "QUIZ" ? "Quiz" : "Poll"} · {q.questions} q</p>
                    </div>
                    <button onClick={() => startQuiz(q.id)} className="btn btn-primary px-3 py-1.5 text-xs">Start</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeId && results && (
          <div className="card fixed bottom-20 right-4 z-40 max-h-[70vh] w-96 max-w-[calc(100vw-2rem)] overflow-y-auto p-4 text-ink">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-semibold leading-tight">{results.title}</p>
                <p className="text-xs text-ink-soft">
                  {results.kind === "QUIZ" ? "Quiz" : "Poll"} · {results.responders} responded
                  {results.scores && ` · avg ${results.scores.students ? Math.round((results.scores.correct / (results.scores.students * results.scores.total)) * 100) : 0}%`}
                </p>
              </div>
              <button onClick={endQuiz} className="btn btn-outline px-3 py-1.5 text-xs">End</button>
            </div>
            <div className="space-y-3">
              {results.questions.map((q, qi) => {
                const max = Math.max(1, ...q.options.map((o) => o.count));
                return (
                  <div key={q.id}>
                    <p className="text-sm font-medium">{qi + 1}. {q.text}</p>
                    <div className="mt-1 space-y-1">
                      {q.options.map((o) => (
                        <div key={o.id} className="flex items-center gap-2 text-xs">
                          <div className="h-5 flex-1 overflow-hidden rounded bg-paper-2">
                            <div className={`h-full ${o.isCorrect ? "bg-pine" : "bg-gold"}`} style={{ width: `${(o.count / max) * 100}%` }} />
                          </div>
                          <span className="w-28 truncate text-ink-soft">{o.text}</span>
                          <span className="w-5 text-right font-mono">{o.count}</span>
                          {o.isCorrect && <span className="text-pine">✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  }

  // ---------- STUDENT ----------
  if (!quiz) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="card max-h-[85vh] w-full max-w-md overflow-y-auto p-6 text-ink">
        <p className="eyebrow">{quiz.kind === "QUIZ" ? "Quiz" : "Poll"}</p>
        <h3 className="mt-1 font-display text-2xl font-semibold">{quiz.title}</h3>
        {submitted ? (
          <p className="chip status-open mx-auto mt-6">✓ Your answers were submitted</p>
        ) : (
          <div className="mt-4 space-y-4">
            {quiz.questions.map((q, qi) => (
              <div key={q.id}>
                <p className="text-sm font-medium">{qi + 1}. {q.text}</p>
                <div className="mt-2 space-y-1.5">
                  {q.options.map((o) => (
                    <label key={o.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm ${answers[q.id] === o.id ? "border-pine bg-pine/5" : "border-line"}`}>
                      <input type="radio" name={q.id} checked={answers[q.id] === o.id} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))} />
                      {o.text}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={submit}
              disabled={Object.keys(answers).length < quiz.questions.length}
              className="btn btn-gold w-full py-2.5 disabled:opacity-50"
            >
              Submit answers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
