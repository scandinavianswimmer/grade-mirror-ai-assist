import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '@supabase/supabase-js';

// Mock the supabase client module before importing the unit under test.
const maybeSingle = vi.fn();
const insert = vi.fn();
const select = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) }));
const from = vi.fn((_table: string) => ({ select, insert }));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => from(table) },
}));

import { ensureUserProfile } from './ensureUserProfile';

const user = {
  id: 'teacher-1',
  email: 'test.teacher@school.edu',
  user_metadata: { name: 'Test Teacher' },
} as unknown as User;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ensureUserProfile — F-002 profile bootstrap (SELECT-first)', () => {
  it('does NOT write when the row already exists (steady state → no upsert 403)', async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: 'teacher-1' }, error: null });

    const result = await ensureUserProfile(user);

    expect(result).toEqual({ ok: true, created: false });
    expect(insert).not.toHaveBeenCalled(); // the regression: no INSERT means no repeated 403
  });

  it('inserts exactly the signed-in user’s own row only when it is missing', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    insert.mockResolvedValueOnce({ error: null });

    const result = await ensureUserProfile(user);

    expect(result).toEqual({ ok: true, created: true });
    expect(insert).toHaveBeenCalledTimes(1);
    const row = insert.mock.calls[0][0];
    expect(row.id).toBe('teacher-1'); // self-scoped: never another user's id
    expect(row.onboarding_complete).toBe(false);
  });

  it('reports an actionable failure (does not throw) when the cold-bootstrap insert is rejected', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    insert.mockResolvedValueOnce({ error: { code: '42501', message: 'permission denied' } });

    const result = await ensureUserProfile(user);

    expect(result).toEqual({ ok: false, reason: 'insert_failed' });
  });

  it('reports lookup_failed without attempting a write when the read errors', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST', message: 'boom' } });

    const result = await ensureUserProfile(user);

    expect(result).toEqual({ ok: false, reason: 'lookup_failed' });
    expect(insert).not.toHaveBeenCalled();
  });
});
