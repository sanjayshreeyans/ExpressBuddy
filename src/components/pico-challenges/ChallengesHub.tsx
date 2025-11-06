/**
 * Pico Challenges Hub
 * Browse and select from available challenges
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';
import { VideoExpressBuddyAvatar } from '../avatar/VideoExpressBuddyAvatar';
import challengeManifestService, { Challenge } from '../../services/challenge-manifest-service';
import '../../styles/hint-animations.css';

export function ChallengesHub() {
    const navigate = useNavigate();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        const loadChallenges = async () => {
            try {
                setLoading(true);
                const allChallenges = await challengeManifestService.getAllChallenges();
                setChallenges(allChallenges);
                console.log('✅ Loaded challenges:', allChallenges.length);
            } catch (err) {
                console.error('❌ Error loading challenges:', err);
                setError('Failed to load challenges');
            } finally {
                setLoading(false);
            }
        };

        loadChallenges();
    }, []);

    const categories = [...new Set(challenges.map(c => c.category))];
    const filteredChallenges = selectedCategory
        ? challenges.filter(c => c.category === selectedCategory)
        : challenges;

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy':
                return 'bg-green-100 text-green-800';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'Hard':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const totalObjectives = challenges.reduce((sum, challenge) => sum + challenge.todos.length, 0);
    const categoriesWithCounts = categories.map(category => ({
        name: category,
        count: challenges.filter(ch => ch.category === category).length
    }));

    if (loading) {
        return (
            <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center font-sans">
                <div className="text-center space-y-3 animate-in fade-in zoom-in duration-500">
                    <div className="text-8xl"></div>
                    <p className="text-lg tracking-wide uppercase text-slate-600 font-semibold">
                        Calibrating Pico's challenge library…
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center font-sans">
                <div className="text-center space-y-4">
                    <div className="text-8xl"></div>
                    <p className="text-2xl font-bold">{error}</p>
                    <Button variant="outline" onClick={() => window.location.reload()} className="text-base font-semibold px-6 py-2">Try again</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-900 font-sans">
            <div className="pointer-events-none absolute inset-x-[-30%] top-[-40%] h-[60vh] rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.15)_0%,_rgba(255,255,255,0)_70%)] blur-3xl" />
            <div className="pointer-events-none absolute inset-x-[-10%] bottom-[-50%] h-[65vh] rounded-full bg-[radial-gradient(circle,_rgba(99,102,241,0.12)_0%,_rgba(255,255,255,0)_70%)] blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0)_45%,rgba(255,255,255,0.2)_100%)]" />

            <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-16 sm:px-8">
                <section className="grid gap-12 lg:grid-cols-[1.2fr,minmax(0,380px)]">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/60 px-4 py-2 text-xs font-medium uppercase tracking-[0.35em] text-slate-700 backdrop-blur-sm">
                            Pico Challenge Hub
                        </div>
                        <header className="space-y-6">
                            <h1 className="text-5xl font-bold leading-tight text-slate-900 sm:text-6xl lg:text-7xl">
                                Teach Pico new life skills inside a playground.
                            </h1>
                            <p className="max-w-2xl text-lg text-slate-700 sm:text-xl lg:text-2xl">
                                Each challenge is a narrated scene where you guide Pico with your own words. Choose a world, explore the learning objectives, and watch the checklist illuminate as he grows.
                            </p>
                        </header>
                        <div className="flex flex-wrap gap-6 text-sm text-slate-700">
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm">
                                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white font-semibold">
                                    {challenges.length}
                                </div>
                                <div className="leading-tight">
                                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Worlds</div>
                                    <div className="text-lg font-semibold text-slate-900">Interactive lessons</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm">
                                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white font-semibold">
                                    {totalObjectives}
                                </div>
                                <div className="leading-tight">
                                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Objectives</div>
                                    <div className="text-lg font-semibold text-slate-900">Moments to unlock</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm">
                                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white font-semibold">
                                    {categories.length}
                                </div>
                                <div className="leading-tight">
                                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Domains</div>
                                    <div className="text-lg font-semibold text-slate-900">Skill collections</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Card className="relative overflow-hidden border border-slate-300 bg-white/80 shadow-[0_35px_80px_-35px_rgba(0,0,0,0.15)] backdrop-blur-sm">
                        <div className="absolute inset-0 bg-[conic-gradient(from_120deg_at_50%_50%,rgba(56,189,248,0.1),rgba(129,140,248,0.08),rgba(56,189,248,0.1))] opacity-50" />
                        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.2)_100%)]" />
                        <CardContent className="relative space-y-2 p-4 flex flex-col items-center justify-center">
                            <div className="w-full h-96 flex items-center justify-center relative">
                                <VideoExpressBuddyAvatar
                                    className="w-full h-full"
                                    isListening={false}
                                    hideDebugInfo={true}
                                    disableClickInteraction={true}
                                    backgroundSrc=""
                                />
                            </div>
                            <div className="text-center space-y-1 mt-1">
                                <h2 className="text-lg font-bold text-slate-900">
                                    Ready to teach Pico?
                                </h2>
                                <p className="text-sm text-slate-600 font-medium max-w-sm">
                                    Pick any challenge to get started.
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate('/Pico-challenge/restaurant-ordering')}
                                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-1.5 text-xs font-bold text-white shadow-[0_2px_8px_-2px_rgba(59,130,246,0.2)] transition hover:bg-sky-600 hover:shadow-[0_4px_12px_-2px_rgba(59,130,246,0.3)] mt-2"
                            >
                                Start Learning
                                <span className="transition-transform duration-200 group-hover:translate-x-0.5 text-xs"></span>
                            </Button>
                        </CardContent>
                    </Card>
                </section>

                {categories.length > 0 && (
                    <section className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-300 bg-white/70 p-5 shadow-[0_25px_60px_-35px_rgba(0,0,0,0.08)] backdrop-blur-sm">
                        <Button
                            onClick={() => setSelectedCategory(null)}
                            variant={selectedCategory === null ? 'default' : 'ghost'}
                            className={cn(
                                'rounded-full px-5 py-2.5 text-base font-bold transition-all',
                                selectedCategory === null
                                    ? 'bg-sky-500 text-white shadow-[0_4px_12px_-3px_rgba(59,130,246,0.3)] hover:bg-sky-600'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            )}
                        >
                            All Worlds
                        </Button>
                        {categoriesWithCounts.map(({ name, count }) => (
                            <Button
                                key={name}
                                onClick={() => setSelectedCategory(name)}
                                variant={selectedCategory === name ? 'default' : 'ghost'}
                                className={cn(
                                    'rounded-full px-5 py-2.5 text-base font-bold transition-all',
                                    selectedCategory === name
                                        ? 'bg-emerald-500 text-white shadow-[0_4px_12px_-3px_rgba(16,185,129,0.3)] hover:bg-emerald-600'
                                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                )}
                            >
                                <span>{name}</span>
                                <span className="text-sm text-slate-600">{count}</span>
                            </Button>
                        ))}
                    </section>
                )}

                <section className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredChallenges.map(challenge => (
                        <Card
                            key={challenge.id}
                            onClick={() => navigate(`/Pico-challenge/${challenge.id}`)}
                            className="group relative overflow-hidden border border-slate-300 bg-white/85 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.1)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-slate-400 hover:shadow-[0_45px_90px_-45px_rgba(59,130,246,0.25)]"
                        >
                            <div
                                className="absolute inset-0 opacity-40 transition duration-300 group-hover:opacity-50"
                                style={{
                                    backgroundImage: `linear-gradient(160deg, rgba(255, 255, 255, 0.7) 10%, rgba(255, 255, 255, 0.4) 100%), url(${challenge.backgroundImage})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.1),_transparent_55%)] opacity-40" />
                            <div className="absolute inset-x-6 top-6 h-[1px] bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300" />

                            <CardHeader className="relative space-y-4 px-6 pb-0 pt-8">
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                    <Badge className={cn('backdrop-blur-sm border-0 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em]', getDifficultyColor(challenge.difficulty))}>
                                        {challenge.difficulty}
                                    </Badge>
                                    <Badge variant="outline" className="border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800">
                                        {challenge.todos.length} objectives
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-2xl font-bold text-slate-900">
                                        {challenge.title}
                                    </CardTitle>
                                    <CardDescription className="text-base text-slate-700 font-medium">
                                        {challenge.category}
                                    </CardDescription>
                                </div>
                            </CardHeader>

                            <CardContent className="relative space-y-6 px-6 pb-7 pt-6 text-sm text-slate-900">
                                <p className="text-base leading-relaxed text-slate-800 font-medium">
                                    {challenge.description}
                                </p>
                                <Separator className="bg-slate-300" />
                                <div className="space-y-4 text-base text-slate-800 font-medium">
                                    {challenge.todos.slice(0, 3).map(todo => (
                                        <div key={todo.id} className="flex items-start gap-3">
                                            <span className="mt-0.5 inline-flex size-2 rounded-full bg-sky-500 flex-shrink-0" />
                                            <span>{todo.text}</span>
                                        </div>
                                    ))}
                                    {challenge.todos.length > 3 && (
                                        <div className="text-slate-700 font-medium">+{challenge.todos.length - 3} more learning beats</div>
                                    )}
                                </div>
                                <Button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        navigate(`/Pico-challenge/${challenge.id}`);
                                    }}
                                    className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-base font-bold text-white shadow-[0_4px_12px_-3px_rgba(59,130,246,0.3)] transition hover:bg-blue-600 hover:shadow-[0_6px_16px_-3px_rgba(59,130,246,0.4)]"
                                >
                                    Enter challenge
                                    <span className="transition-transform duration-200 group-hover/btn:translate-x-1"></span>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                {filteredChallenges.length === 0 && (
                    <div className="rounded-3xl border border-slate-300 bg-white/70 p-16 text-center text-slate-700 shadow-[0_25px_60px_-30px_rgba(0,0,0,0.08)] backdrop-blur-sm">
                        <div className="text-5xl mb-4"></div>
                        <p className="text-lg text-slate-800 font-medium">No worlds match that filter yet. Try a different domain.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChallengesHub;
