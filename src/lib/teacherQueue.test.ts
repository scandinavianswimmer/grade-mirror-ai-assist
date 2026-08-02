import { describe, expect, it } from 'vitest';

import { buildTeacherQueue } from './teacherQueue';

const assignments = [
  {
    id: 'assignment-1',
    title: 'Argument essay',
    classId: 'class-1',
    courseName: null,
    dueDate: '2026-08-03T12:00:00.000Z',
    createdAt: '2026-08-01T12:00:00.000Z',
  },
];

describe('buildTeacherQueue', () => {
  it('derives attention, draft, active, and approved rows from persisted state', () => {
    const queue = buildTeacherQueue(
      assignments,
      [
        { id: 's1', assignmentId: 'assignment-1', studentName: 'A', status: 'needs_review', hasGrade: false, createdAt: '2026-08-01T13:00:00.000Z' },
        { id: 's2', assignmentId: 'assignment-1', studentName: 'B', status: 'graded', hasGrade: true, createdAt: '2026-08-01T14:00:00.000Z' },
        { id: 's3', assignmentId: 'assignment-1', studentName: 'C', status: 'grading', hasGrade: false, createdAt: '2026-08-01T15:00:00.000Z' },
        { id: 's4', assignmentId: 'assignment-1', studentName: 'D', status: 'finalized', hasGrade: true, finalizedBy: 'teacher', createdAt: '2026-08-01T16:00:00.000Z' },
      ],
      new Map([['class-1', 'English 10']]),
    );

    expect(queue.needs_attention[0]).toMatchObject({ assignmentTitle: 'Argument essay', className: 'English 10', count: 1 });
    expect(queue.drafts_ready[0].summary).toContain('1 draft is ready');
    expect(queue.keep_going[0].summary).toContain('1 drafting now');
    expect(queue.approved_recently[0].summary).toContain('1 approved');
  });

  it('reconciles a stale error with an existing grade into Ready for review', () => {
    const queue = buildTeacherQueue(
      assignments,
      [{ id: 's1', assignmentId: 'assignment-1', studentName: 'A', status: 'grade_error', hasGrade: true, createdAt: '2026-08-01T13:00:00.000Z' }],
      new Map(),
    );

    expect(queue.needs_attention).toHaveLength(0);
    expect(queue.drafts_ready).toHaveLength(1);
  });

  it('keeps automatic approval attributable and exported work distinct', () => {
    const queue = buildTeacherQueue(
      assignments,
      [
        { id: 's1', assignmentId: 'assignment-1', studentName: 'A', status: 'finalized', hasGrade: true, finalizedBy: 'ai', createdAt: '2026-08-01T13:00:00.000Z' },
        { id: 's2', assignmentId: 'assignment-1', studentName: 'B', status: 'exported', hasGrade: true, finalizedBy: 'ai', createdAt: '2026-08-01T14:00:00.000Z' },
      ],
      new Map(),
    );

    expect(queue.approved_recently[0].summary).toContain('2 approved');
    expect(queue.approved_recently[0].summary).toContain('1 exported');
    expect(queue.approved_recently[0].summary).toContain('Approved automatically for 2 · You turned this on');
  });

  it('keeps an empty assignment actionable instead of dropping it', () => {
    const queue = buildTeacherQueue(assignments, [], new Map());

    expect(queue.keep_going[0]).toMatchObject({ count: 0, actionLabel: 'Add student work' });
    expect(queue.keep_going[0].summary).toContain('No student work yet');
  });
});
