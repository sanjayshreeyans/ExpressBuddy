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
      <CardContent className="space-y-3">
        {localTodos.map((todo) => (
          <div 
            key={todo.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
              todo.complete 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-1 ${
                todo.complete 
                  ? 'bg-green-500 border-green-600' 
                  : 'bg-white border-gray-300'
              }`}
            >
              {todo.complete && (
                <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              )}
            </div>
            <div className="flex-1">
              <label
                htmlFor={`todo-${todo.id}`}
                className={`text-sm font-bold leading-tight cursor-default ${
                  todo.complete ? 'text-green-700 line-through' : 'text-slate-900'
                }`}
              >
                {todo.text}
              </label>
              {!todo.complete && (
                <p className="text-xs text-slate-600 mt-1">
                  {todo.description}
                </p>
              )}
            </div>
            {todo.complete && (
              <span className="text-lg"></span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
