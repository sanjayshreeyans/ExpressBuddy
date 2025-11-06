import {
  get_todo_status as manifest_get_todo_status,
  mark_todo_complete as manifest_mark_todo_complete,
  reset_todos as manifest_reset_todos,
  get_completion_percentage as manifest_get_completion_percentage,
  is_challenge_complete as manifest_is_challenge_complete,
  ChallengeTodo
} from './challenge-manifest-service';

/**
 * Compatibility wrapper around the manifest service.
 * This keeps existing components working while manifest-driven
 * challenges provide the actual todo definitions.
 */

export type { ChallengeTodo };

export function get_todo_status(): ChallengeTodo[] {
  return manifest_get_todo_status();
}

export function mark_todo_complete(todoId: number, isCorrect: boolean = true) {
  return manifest_mark_todo_complete(todoId, isCorrect);
}

export function reset_todos() {
  return manifest_reset_todos();
}

export function get_completion_percentage(): number {
  return manifest_get_completion_percentage();
}

export function is_challenge_complete(): boolean {
  return manifest_is_challenge_complete();
}

export default {
  get_todo_status,
  mark_todo_complete,
  reset_todos,
  get_completion_percentage,
  is_challenge_complete
};
