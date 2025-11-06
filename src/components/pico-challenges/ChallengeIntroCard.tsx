import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Challenge } from '../../services/challenge-manifest-service';

interface ChallengeIntroCardProps {
  challenge: Challenge;
  onStart: () => void;
  onLearnMore: () => void;
  onClose?: () => void;
}

export function ChallengeIntroCard({ challenge, onStart, onLearnMore, onClose }: ChallengeIntroCardProps) {
  const bulletPoints = challenge.todos.slice(0, 5);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="absolute inset-0 pointer-events-none bg-slate-950/45 backdrop-blur-2xl" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-slate-900/20 via-slate-900/10 to-slate-900/30" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.25),_transparent_60%)] opacity-90" />

      <Card className="relative w-full max-w-4xl mx-auto overflow-hidden border border-white/40 bg-white/85 shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-cyan-400" />

        <CardHeader className="px-8 pt-10 pb-0 text-left space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600 ring-1 ring-emerald-200/80">
            {challenge.category}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold leading-snug text-slate-900">
              {challenge.title}
            </CardTitle>
            <CardDescription className="max-w-2xl text-base text-slate-600">
              {challenge.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10 pt-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr,1fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                  Your Mission
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  {challenge.description}
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-emerald-50/90 via-sky-50/90 to-white/90 p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-700">
                  What You'll Cover
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  {bulletPoints.map((todo) => (
                    <li key={todo.id} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{todo.text}</span>
                    </li>
                  ))}
                  {challenge.todos.length > bulletPoints.length && (
                    <li className="flex items-start gap-3 text-slate-500 italic text-sm">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                      <span>+{challenge.todos.length - bulletPoints.length} more objectives</span>
                    </li>
                  )}
                </ul>
              </section>
            </div>

            <aside className="flex flex-col justify-between gap-6 rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-lg backdrop-blur">
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-slate-900">
                  Ready to coach Pico?
                </h4>
                <p className="text-sm leading-relaxed text-slate-600">
                  He listens in real time. Speak naturally, give him tips, and celebrate his progress as each learning goal lights up.
                </p>
              </div>

              <div className="grid gap-3">
                <Button
                  onClick={onStart}
                  size="lg"
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Start Challenge
                </Button>
                <Button
                  onClick={onLearnMore}
                  variant="outline"
                  size="lg"
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Preview Learning Goals
                </Button>
                {onClose && (
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="w-full text-slate-500 hover:text-slate-700"
                  >
                    Maybe Later
                  </Button>
                )}
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
