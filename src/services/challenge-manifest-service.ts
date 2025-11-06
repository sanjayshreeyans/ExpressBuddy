/**
 * Challenge Manifest Service
 * Loads challenges from challenges_manifest.json
 * Provides utilities for managing challenge data and todos
 */

export interface ChallengeTodo {
  id: number;
  text: string;
  description: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  keywords?: string[];
  complete?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  backgroundImage: string;
  videoPath?: string;
  systemPrompt: string;
  hintPrompt: string;
  todos: ChallengeTodo[];
}

export interface ChallengesManifest {
  challenges: Challenge[];
}

// Cache for loaded manifest
let cachedManifest: ChallengesManifest | null = null;
let currentChallenge: Challenge | null = null;
let currentTodos: ChallengeTodo[] = [];

/**
 * Load challenges manifest from public/challenges_manifest.json
 */
export async function loadChallengesManifest(): Promise<ChallengesManifest> {
  if (cachedManifest) {
    console.log('📋 Using cached challenges manifest');
    return cachedManifest;
  }

  try {
    const response = await fetch('/challenges_manifest.json');
    if (!response.ok) {
      throw new Error(`Failed to load manifest: ${response.status}`);
    }
    
    cachedManifest = await response.json();
    if (cachedManifest) {
      console.log('✅ Challenges manifest loaded:', {
        totalChallenges: cachedManifest.challenges.length,
        challenges: cachedManifest.challenges.map(c => c.title)
      });
      return cachedManifest;
    }
    throw new Error('Manifest is empty');
  } catch (err) {
    console.error('❌ Error loading challenges manifest:', err);
    throw err;
  }
}

/**
 * Get all available challenges
 */
export async function getAllChallenges(): Promise<Challenge[]> {
  const manifest = await loadChallengesManifest();
  return manifest.challenges;
}

/**
 * Get a specific challenge by ID
 */
export async function getChallengeById(challengeId: string): Promise<Challenge | null> {
  const manifest = await loadChallengesManifest();
  const challenge = manifest.challenges.find(c => c.id === challengeId);
  
  if (challenge) {
    // Initialize the challenge
    setCurrentChallenge(challenge);
    console.log('🎯 Challenge loaded:', challenge.title);
  }
  
  return challenge || null;
}

/**
 * Set the current active challenge
 */
export function setCurrentChallenge(challenge: Challenge): void {
  currentChallenge = challenge;
  // Initialize todos with complete flag
  currentTodos = challenge.todos.map(todo => ({
    ...todo,
    complete: false
  }));
  console.log('🎯 Current challenge set:', {
    title: challenge.title,
    todos: currentTodos.length
  });
}

/**
 * Get current active challenge
 */
export function getCurrentChallenge(): Challenge | null {
  return currentChallenge;
}

/**
 * Get current todo status
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
 * Mark a specific todo as complete
 */
export function mark_todo_complete(todoId: number, isCorrect: boolean = true): { 
  success: boolean; 
  todo?: ChallengeTodo; 
  error?: string;
  allComplete?: boolean;
} {
  console.log('✅ mark_todo_complete called:', { todoId, isCorrect });

  if (todoId < 1 || todoId > currentTodos.length) {
    console.error('❌ Invalid todoId:', todoId);
    return {
      success: false,
      error: `Invalid todo ID: ${todoId}. Must be between 1 and ${currentTodos.length}`
    };
  }

  const todoIndex = todoId - 1;
  const todo = currentTodos[todoIndex];

  // Mark as complete
  todo.complete = isCorrect;

  console.log('✅ Todo updated:', {
    id: todo.id,
    text: todo.text,
    complete: todo.complete,
    completedCount: currentTodos.filter(t => t.complete).length,
    totalCount: currentTodos.length
  });

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
 */
export function reset_todos(): { success: boolean; message: string } {
  console.log('🔄 reset_todos called');
  
  // Reset to original state
  if (currentChallenge) {
    currentTodos = currentChallenge.todos.map(todo => ({
      ...todo,
      complete: false
    }));
  }
  
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
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

/**
 * Check if challenge is complete
 */
export function is_challenge_complete(): boolean {
  return currentTodos.length > 0 && currentTodos.every(t => t.complete);
}

/**
 * Get challenge by category
 */
export async function getChallengesByCategory(category: string): Promise<Challenge[]> {
  const manifest = await loadChallengesManifest();
  return manifest.challenges.filter(c => c.category === category);
}

/**
 * Get challenges by difficulty
 */
export async function getChallengesByDifficulty(difficulty: "Easy" | "Medium" | "Hard"): Promise<Challenge[]> {
  const manifest = await loadChallengesManifest();
  return manifest.challenges.filter(c => c.difficulty === difficulty);
}

/**
 * Get system prompt for current challenge
 */
export function getSystemPrompt(): string {
  if (!currentChallenge) {
    console.warn('⚠️ No current challenge set');
    return '';
  }
  
  return currentChallenge.systemPrompt;
}

/**
 * Get hint prompt for current challenge
 */
export function getHintPrompt(): string {
  if (!currentChallenge) {
    console.warn('⚠️ No current challenge set');
    return '';
  }
  
  const completedCount = currentTodos.filter(t => t.complete).length;
  const totalCount = currentTodos.length;
  
  // Customize hint prompt with completion info
  return `Current progress: ${completedCount}/${totalCount} objectives complete.\n\n${currentChallenge.hintPrompt}`;
}

/**
 * Get background image for current challenge
 */
export function getBackgroundImage(): string {
  if (!currentChallenge) {
    return '';
  }
  return currentChallenge.backgroundImage;
}

export default {
  loadChallengesManifest,
  getAllChallenges,
  getChallengeById,
  setCurrentChallenge,
  getCurrentChallenge,
  get_todo_status,
  mark_todo_complete,
  reset_todos,
  get_completion_percentage,
  is_challenge_complete,
  getChallengesByCategory,
  getChallengesByDifficulty,
  getSystemPrompt,
  getHintPrompt,
  getBackgroundImage
};
