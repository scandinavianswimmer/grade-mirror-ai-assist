import { effectiveStatus } from './submissionStatus';

export type TeacherQueueGroup =
  | 'needs_attention'
  | 'drafts_ready'
  | 'keep_going'
  | 'approved_recently';

export interface TeacherQueueAssignment {
  id: string;
  title: string;
  classId?: string | null;
  courseName?: string | null;
  dueDate?: string | null;
  createdAt?: string | null;
}

export interface TeacherQueueSubmission {
  id: string;
  assignmentId: string;
  studentName?: string | null;
  status: string | null;
  hasGrade: boolean;
  finalizedBy?: string | null;
  autoFinalizedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TeacherQueueRow {
  id: string;
  group: TeacherQueueGroup;
  assignmentId: string;
  assignmentTitle: string;
  className: string;
  summary: string;
  count: number;
  dueDate?: string | null;
  activityAt?: string | null;
  actionLabel: string;
}

export type TeacherQueue = Record<TeacherQueueGroup, TeacherQueueRow[]>;

const plural = (count: number, one: string, many = `${one}s`) => count === 1 ? one : many;

const latestTimestamp = (submissions: TeacherQueueSubmission[]): string | null => {
  const timestamps = submissions
    .flatMap((submission) => [submission.autoFinalizedAt, submission.updatedAt, submission.createdAt])
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return timestamps[0] ?? null;
};

const emptyQueue = (): TeacherQueue => ({
  needs_attention: [],
  drafts_ready: [],
  keep_going: [],
  approved_recently: [],
});

export const buildTeacherQueue = (
  assignments: TeacherQueueAssignment[],
  submissions: TeacherQueueSubmission[],
  classNames: Map<string, string>,
): TeacherQueue => {
  const queue = emptyQueue();

  for (const assignment of assignments) {
    const stack = submissions.filter((submission) => submission.assignmentId === assignment.id);
    const byStatus = stack.map((submission) => ({
      submission,
      status: effectiveStatus(submission.status, submission.hasGrade),
    }));
    const className = (assignment.classId && classNames.get(assignment.classId))
      || assignment.courseName
      || 'No class assigned';
    const activityAt = latestTimestamp(stack) || assignment.createdAt || null;
    const base = {
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      className,
      dueDate: assignment.dueDate,
      activityAt,
    };

    const attention = byStatus.filter(({ status }) => status === 'needs_review' || status === 'grade_error');
    if (attention.length > 0) {
      queue.needs_attention.push({
        ...base,
        id: `${assignment.id}:needs_attention`,
        group: 'needs_attention',
        count: attention.length,
        summary: `${attention.length} ${plural(attention.length, 'submission')} ${attention.length === 1 ? 'needs' : 'need'} a closer look before drafting can continue.`,
        actionLabel: 'Review submissions',
      });
    }

    const drafts = byStatus.filter(({ status }) => status === 'graded' || status === 'ai_graded');
    if (drafts.length > 0) {
      queue.drafts_ready.push({
        ...base,
        id: `${assignment.id}:drafts_ready`,
        group: 'drafts_ready',
        count: drafts.length,
        summary: `${drafts.length} ${plural(drafts.length, 'draft')} ${drafts.length === 1 ? 'is' : 'are'} ready for your review. Nothing has been released.`,
        actionLabel: 'Review drafts',
      });
    }

    const ready = byStatus.filter(({ status }) => status === 'uploaded' || status === 'pending').length;
    const drafting = byStatus.filter(({ status }) => status === 'grading').length;
    if (stack.length === 0 || ready > 0 || drafting > 0) {
      const parts = [
        ready > 0 ? `${ready} ready to draft` : null,
        drafting > 0 ? `${drafting} drafting now` : null,
      ].filter(Boolean);
      queue.keep_going.push({
        ...base,
        id: `${assignment.id}:keep_going`,
        group: 'keep_going',
        count: ready + drafting,
        summary: stack.length === 0
          ? 'No student work yet. Add submissions when the assignment is ready.'
          : `${parts.join(' · ')}.`,
        actionLabel: stack.length === 0 ? 'Add student work' : 'Check progress',
      });
    }

    const approved = byStatus.filter(({ status }) => status === 'finalized' || status === 'exported');
    if (approved.length > 0) {
      const exported = approved.filter(({ status }) => status === 'exported').length;
      const automatic = approved.filter(({ submission }) => submission.finalizedBy === 'ai' || Boolean(submission.autoFinalizedAt)).length;
      const parts = [
        `${approved.length} approved`,
        exported > 0 ? `${exported} exported` : null,
        automatic > 0 ? `Approved automatically for ${automatic} · You turned this on` : null,
      ].filter(Boolean);
      queue.approved_recently.push({
        ...base,
        id: `${assignment.id}:approved_recently`,
        group: 'approved_recently',
        count: approved.length,
        summary: `${parts.join(' · ')}.`,
        actionLabel: 'View approved work',
      });
    }
  }

  for (const rows of Object.values(queue)) {
    rows.sort((a, b) => new Date(b.activityAt ?? 0).getTime() - new Date(a.activityAt ?? 0).getTime());
  }

  return queue;
};
