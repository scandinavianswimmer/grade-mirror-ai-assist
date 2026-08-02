import { beforeEach, describe, expect, it, vi } from 'vitest'

const invoke = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } }
}))

import { deleteAllUserData } from './privacyApi'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('deleteAllUserData', () => {
  it('invokes the authenticated server erasure path without a client-supplied user id', async () => {
    const confirmation = {
      scope: 'account',
      deletedSubmissions: 3,
      filesRemoved: 4,
      bucketsProcessed: ['submissions', 'uploads', 'grading-examples', 'training-data'],
      accountRetained: true
    }
    invoke.mockResolvedValueOnce({ data: confirmation, error: null })

    await expect(deleteAllUserData()).resolves.toEqual(confirmation)
    expect(invoke).toHaveBeenCalledWith('delete-data', { body: { scope: 'account' } })
  })

  it('surfaces the edge function storage verification error', async () => {
    const context = {
      json: async () => ({
        error: 'Storage deletion could not be verified, so database records were preserved.',
        stage: 'storage_verify'
      })
    }
    invoke.mockResolvedValueOnce({ data: null, error: { name: 'FunctionsHttpError', context } })

    await expect(deleteAllUserData()).rejects.toThrow(/database records were preserved/)
  })

  it('does not treat malformed success data as a confirmed erasure', async () => {
    invoke.mockResolvedValueOnce({ data: { scope: 'account' }, error: null })

    await expect(deleteAllUserData()).rejects.toThrow(/invalid confirmation/)
  })

  it('does not accept a partial bucket purge as a confirmed account erasure', async () => {
    invoke.mockResolvedValueOnce({
      data: {
        scope: 'account',
        deletedSubmissions: 1,
        filesRemoved: 1,
        bucketsProcessed: ['submissions'],
        accountRetained: true
      },
      error: null
    })

    await expect(deleteAllUserData()).rejects.toThrow(/invalid confirmation/)
  })

  it('uses retry-safe wording for a non-JSON function error', async () => {
    const context = { json: async () => { throw new Error('not json') } }
    invoke.mockResolvedValueOnce({ data: null, error: { name: 'FunctionsHttpError', context } })

    await expect(deleteAllUserData()).rejects.toThrow(/not reported as deleted/)
  })
})
