import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';

interface ChallengeIntroCardProps {
  onStart: () => void;
  onLearnMore: () => void;
  onClose?: () => void;
}

export function ChallengeIntroCard({ onStart, onLearnMore, onClose }: ChallengeIntroCardProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-12 sm:py-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-slate-950/35 backdrop-blur-lg" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.25),_transparent_60%)] opacity-95" />

      <Card className="relative w-full max-w-4xl mx-auto overflow-hidden border border-white/40 bg-white/85 shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-cyan-400" />

        <CardHeader className="px-8 pt-10 pb-0 text-left space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600 ring-1 ring-emerald-200/80">
            Interactive Challenge
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold leading-snug text-slate-900">
              Guide Piko Through His First Restaurant Order
            </CardTitle>
            <CardDescription className="max-w-2xl text-base text-slate-600">
              Piko is at the table, nervous about speaking to the waiter. Coach him through each step so he feels confident, calm, and ready to order on his own.
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
                  Teach Piko how to order food politely at a restaurant. Help him practice what to say when the waiter arrives, how to explain what he wants, and how to respond with confidence.
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-emerald-50/90 via-sky-50/90 to-white/90 p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-700">
                  What You'll Cover
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Greeting the waiter with a friendly hello.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Using polite words like "please" when asking for food.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Describing his meal choice clearly so the waiter understands.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Remembering to thank the waiter after ordering.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Asking for help if he feels unsure about the menu.</span>
                  </li>
                </ul>
              </section>
            </div>

            <aside className="flex flex-col justify-between gap-6 rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-lg backdrop-blur">
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-slate-900">
                  Ready to coach Piko?
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
