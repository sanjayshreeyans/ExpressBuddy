import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ChallengeTodo } from '../../services/challenge-todo-service';

interface ChallengeChecklistProps {
  todos: ChallengeTodo[];
  className?: string;
}

export function ChallengeChecklist({ todos, className }: ChallengeChecklistProps) {
  const [localTodos, setLocalTodos] = useState<ChallengeTodo[]>(todos);

  // Listen for todo updates from the service
  useEffect(() => {
    const handleTodoUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { allTodos } = customEvent.detail;
      console.log('📋 ChallengeChecklist received update:', allTodos);
      setLocalTodos(allTodos);
    };

    const handleTodoReset = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { allTodos } = customEvent.detail;
      console.log('🔄 ChallengeChecklist received reset:', allTodos);
      setLocalTodos(allTodos);
    };

    window.addEventListener('challenge-todo-updated', handleTodoUpdate);
    window.addEventListener('challenge-todo-reset', handleTodoReset);

    return () => {
      window.removeEventListener('challenge-todo-updated', handleTodoUpdate);
      window.removeEventListener('challenge-todo-reset', handleTodoReset);
    };
  }, []);

  // Update local state when props change
  useEffect(() => {
    setLocalTodos(todos);
  }, [todos]);

  const completedCount = localTodos.filter(t => t.complete).length;
  const totalCount = localTodos.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <Card 
      className={`fixed top-40 right-4 z-50 w-80 shadow-lg ${className || ''}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto'
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <span>Piko's Learning Goals</span>
          </CardTitle>
          <Badge 
            variant={completionPercentage === 100 ? "default" : "secondary"}
            className="text-sm font-semibold"
          >
            {completedCount}/{totalCount}
          </Badge>
        </div>
        <div className="mt-2">
          <div className="h-2 w-full bg-gray-300 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {localTodos.map((todo) => (
          <div 
            key={todo.id}
            className={`group relative flex items-start gap-3.5 p-4 rounded-xl border-2 transition-all duration-300 ${
              todo.complete 
                ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300 shadow-sm' 
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
            }`}
          >
            <div
              className={`relative flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5 transition-all duration-200 ${
                todo.complete 
                  ? 'bg-emerald-500 border-emerald-600 shadow-sm' 
                  : 'bg-white border-slate-300 group-hover:border-emerald-400'
              }`}
            >
              {todo.complete && (
                <svg 
                  className="w-4 h-4 text-white" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="3" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={`text-sm font-bold leading-snug ${
                  todo.complete ? 'text-emerald-700 line-through' : 'text-slate-900'
                }`}
              >
                {todo.text}
              </div>
              {!todo.complete && (
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {todo.description}
                </p>
              )}
            </div>
            {todo.complete && (
              <div className="absolute top-3 right-3 text-emerald-500 animate-in fade-in zoom-in duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
