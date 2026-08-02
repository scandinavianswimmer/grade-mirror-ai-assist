import { describe, expect, it } from 'vitest';

import {
  buildReleaseProof,
  NOT_CAPTURED_FOR_RELEASE,
  type ReleaseProofItem,
} from './releaseProof';

const itemById = (items: ReleaseProofItem[], id: ReleaseProofItem['id']) => {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing release proof item: ${id}`);
  return item;
};

describe('buildReleaseProof', () => {
  it('fails closed when the release has no public proof metadata', () => {
    const proof = buildReleaseProof({});
    const items = proof.groups.flatMap((group) => group.items);

    expect(proof.recordedCount).toBe(0);
    expect(proof.totalCount).toBe(9);
    expect(items.every((item) => item.state === 'not_captured')).toBe(true);
    expect(items.every((item) => item.value === NOT_CAPTURED_FOR_RELEASE)).toBe(true);
  });

  it('records only allow-listed, non-placeholder build and production values', () => {
    const proof = buildReleaseProof({
      VITE_RELEASE_SHA: '  f7b92225128ea7a0966607da221f909782d217c9  ',
      VITE_DEPLOYED_VERSION: 'worker-version-123',
      VITE_PROOF_GEMINI_MODEL: 'gemini-model-observed-in-production',
      VITE_PROOF_TRACE_ID: 'trace-redacted-42',
      VITE_PROOF_AGENT_STATES: 'rubric:ok, relevance:withheld',
      PRIVATE_STUDENT_NAME: 'must never leak',
    });
    const items = proof.groups.flatMap((group) => group.items);

    expect(itemById(items, 'release_sha').value).toBe('f7b92225128ea7a0966607da221f909782d217c9');
    expect(itemById(items, 'deployed_version').state).toBe('recorded');
    expect(itemById(items, 'gemini_model').state).toBe('recorded');
    expect(itemById(items, 'google_cloud_service').value).toBe(NOT_CAPTURED_FOR_RELEASE);
    expect(JSON.stringify(proof)).not.toContain('must never leak');
    expect(proof.recordedCount).toBe(5);
  });

  it('rejects placeholder language instead of presenting it as proof', () => {
    const proof = buildReleaseProof({
      VITE_RELEASE_SHA: 'TBD',
      VITE_PROOF_GEMINI_MODEL: 'sample',
      VITE_PROOF_TRACE_ID: 'Not captured for this release',
      VITE_PROOF_GOOGLE_CLOUD_SERVICE: '[VERIFIED_GOOGLE_CLOUD_PRODUCT]',
      VITE_PROOF_RELOAD_PROOF: '${RELOAD_EVIDENCE}',
      VITE_PROOF_PERSISTED_RESULT: false,
    });

    expect(proof.recordedCount).toBe(0);
  });

  it('supports explicit aliases for common release metadata names', () => {
    const proof = buildReleaseProof({
      VITE_GIT_COMMIT_SHA: 'commit-alias',
      VITE_CLOUDFLARE_WORKER_VERSION: 'worker-alias',
    });
    const buildItems = proof.groups.find((group) => group.id === 'build')?.items ?? [];

    expect(itemById(buildItems, 'release_sha').value).toBe('commit-alias');
    expect(itemById(buildItems, 'deployed_version').value).toBe('worker-alias');
  });
});
