import type { UserSummary } from '@/types/common.type';
import type { Task } from '@/types/task.type';

export type TaskDueState = 'overdue' | 'today' | 'upcoming';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getTaskDueState(
  task: Pick<Task, 'dueAt' | 'status'>,
): TaskDueState | null {
  if (!task.dueAt || task.status === 'done') return null;
  const due = new Date(task.dueAt);
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (due < today) return 'overdue';
  if (due < tomorrow) return 'today';
  return 'upcoming';
}

export function formatTaskDue(dueAt: string | null) {
  if (!dueAt) return '';
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function userDisplayName(user: UserSummary | null | undefined) {
  if (!user) return '';
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return name || user.email;
}

export function taskLinkLabel(task: Task) {
  const parts: string[] = [];
  if (task.candidate) {
    parts.push(`${task.candidate.firstName} ${task.candidate.lastName}`.trim());
  }
  if (task.job) parts.push(task.job.title);
  if (!task.candidate && !task.job && task.client) parts.push(task.client.name);
  return parts.join(' · ');
}

export function taskLinkHref(task: Task) {
  if (task.candidate) return `/dashboard/candidates?id=${task.candidate.id}`;
  if (task.job) return `/dashboard/jobs?id=${task.job.id}`;
  if (task.client) return `/dashboard/clients?id=${task.client.id}`;
  return null;
}

export const TASK_DUE_CLASS: Record<TaskDueState, string> = {
  overdue: 'font-medium text-red-600 dark:text-red-400',
  today: 'font-medium text-amber-600 dark:text-amber-400',
  upcoming: 'text-foreground',
};
