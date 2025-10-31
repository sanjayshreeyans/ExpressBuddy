/**
 * Piko Challenge Todo Service
 * Manages todo list for interactive challenges where children teach Piko social skills
 */

export interface ChallengeTodo {
  id: number;
  text: string;
  description: string;
  complete: boolean;
}

// Define the 5 learning objectives for "Ordering Food at a Restaurant" - Level 1
const RESTAURANT_ORDERING_TODOS: ChallengeTodo[] = [
  {
    id: 1,
    text: "Greet the waiter politely",
    description: "Teach Piko to say hello and be friendly when the waiter arrives",
    complete: false
  },
  {
    id: 2,
    text: "Use the word 'please' when ordering",
    description: "Help Piko understand that saying 'please' makes requests sound polite",
    complete: false
  },
  {
    id: 3,
    text: "Clearly state what food you want",
    description: "Show Piko how to tell the waiter exactly what food he'd like to order",
    complete: false
  },
  {
    id: 4,
    text: "Say 'thank you' after ordering",
    description: "Remind Piko to thank the waiter for helping him",
    complete: false
  },
  {
    id: 5,
    text: "Know how to ask for help if confused",
    description: "Teach Piko that it's okay to ask questions if he doesn't understand the menu",
    complete: false
  }
];

// Store todos in memory (reset on page refresh, which is fine for a single session)
let currentTodos: ChallengeTodo[] = JSON.parse(JSON.stringify(RESTAURANT_ORDERING_TODOS));

/**
 * Get current status of all todos
 * Returns a copy to prevent direct mutation
 */
export function get_todo_status(): ChallengeTodo[] {
  console.log('📋 get_todo_status called:', {
    todos: currentTodos,
    completed: currentTodos.filter(t => t.complete).length,
    total: currentTodos.length
  });
  
  return JSON.parse(JSON.stringify(currentTodos));
}

/**
 * Mark a specific todo as complete or incomplete
 * @param todoId - ID of the todo (1-5)
 * @param isCorrect - Whether the child's teaching was correct (for this challenge, always true to be forgiving)
 * @returns Updated todo item
 */
export function mark_todo_complete(todoId: number, isCorrect: boolean = true): { 
  success: boolean; 
  todo?: ChallengeTodo; 
  error?: string;
  allComplete?: boolean;
} {
  console.log('✅ mark_todo_complete called:', { todoId, isCorrect });

  // Validate todoId
  if (todoId < 1 || todoId > currentTodos.length) {
    console.error('❌ Invalid todoId:', todoId);
    return {
      success: false,
      error: `Invalid todo ID: ${todoId}. Must be between 1 and ${currentTodos.length}`
    };
  }

  // Find the todo (array is 0-indexed, IDs are 1-indexed)
  const todoIndex = todoId - 1;
  const todo = currentTodos[todoIndex];

  // Mark as complete (we're forgiving - any attempt counts)
  todo.complete = isCorrect;

  console.log('✅ Todo updated:', {
    id: todo.id,
    text: todo.text,
    complete: todo.complete,
    completedCount: currentTodos.filter(t => t.complete).length,
    totalCount: currentTodos.length
  });

  // Check if all todos are complete
  const allComplete = currentTodos.every(t => t.complete);

  // Dispatch custom event for UI updates
  window.dispatchEvent(new CustomEvent('challenge-todo-updated', {
    detail: {
      todoId,
      todo: JSON.parse(JSON.stringify(todo)),
      allTodos: JSON.parse(JSON.stringify(currentTodos)),
      allComplete
    }
  }));

  return {
    success: true,
    todo: JSON.parse(JSON.stringify(todo)),
    allComplete
  };
}

/**
 * Reset all todos to incomplete state
 * Useful for restarting the challenge
 */
export function reset_todos(): { success: boolean; message: string } {
  console.log('🔄 reset_todos called');
  
  // Reset to original state
  currentTodos = JSON.parse(JSON.stringify(RESTAURANT_ORDERING_TODOS));
  
  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('challenge-todo-reset', {
    detail: {
      allTodos: JSON.parse(JSON.stringify(currentTodos))
    }
  }));

  console.log('🔄 Todos reset:', currentTodos);

  return {
    success: true,
    message: 'All todos have been reset to incomplete'
  };
}

/**
 * Get completion percentage
 */
export function get_completion_percentage(): number {
  const completed = currentTodos.filter(t => t.complete).length;
  const total = currentTodos.length;
  return Math.round((completed / total) * 100);
}

/**
 * Check if challenge is complete
 */
export function is_challenge_complete(): boolean {
  return currentTodos.every(t => t.complete);
}

export default {
  get_todo_status,
  mark_todo_complete,
  reset_todos,
  get_completion_percentage,
  is_challenge_complete
};
