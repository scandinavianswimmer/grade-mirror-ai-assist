// Tests for the pure Gemini backend-selection + endpoint-construction logic.
// vertex-endpoint.ts is a PURE module (no Deno imports, no I/O), so it runs unchanged under vitest.
// These lock the M1 contract: studio is the default and stays byte-for-byte unchanged; Vertex is
// only selected when explicitly requested AND fully configured; the Vertex URL is built correctly.
// Run via the root vitest config (supabase/functions/_shared/** is in its include globs).
import { describe, it, expect } from 'vitest';

import {
  authModeFor,
  resolveBackend,
  selectVertex,
  studioEndpointUrl,
  STUDIO_BASE,
  vertexEndpointUrl,
  type BackendSelectionInput,
} from './vertex-endpoint.ts';

// A fully-configured Vertex input; individual tests override one field to prove each prerequisite.
const fullVertex: BackendSelectionInput = {
  geminiBackend: 'vertex',
  vertexAiEnabled: false,
  vertexProject: 'aita-prod',
  vertexLocation: 'us-central1',
  hasGoogleCredential: true,
};

// The default/empty environment — nothing set.
const defaultEnv: BackendSelectionInput = {
  geminiBackend: '',
  vertexAiEnabled: false,
  vertexProject: '',
  vertexLocation: '',
  hasGoogleCredential: false,
};

describe('selectVertex — backend gating (OFF by default)', () => {
  it('defaults to studio when nothing is configured', () => {
    expect(selectVertex(defaultEnv)).toBe(false);
    expect(resolveBackend(defaultEnv)).toBe('studio');
  });

  it('selects vertex when GEMINI_BACKEND=vertex AND fully configured', () => {
    expect(selectVertex(fullVertex)).toBe(true);
    expect(resolveBackend(fullVertex)).toBe('vertex');
  });

  it('selects vertex via the VERTEX_AI boolean toggle (no GEMINI_BACKEND set)', () => {
    const viaToggle: BackendSelectionInput = {
      ...fullVertex,
      geminiBackend: '',
      vertexAiEnabled: true,
    };
    expect(selectVertex(viaToggle)).toBe(true);
  });

  it('stays on studio when Vertex is requested but VERTEX_PROJECT is missing', () => {
    expect(selectVertex({ ...fullVertex, vertexProject: '' })).toBe(false);
  });

  it('stays on studio when Vertex is requested but VERTEX_LOCATION is missing', () => {
    expect(selectVertex({ ...fullVertex, vertexLocation: '' })).toBe(false);
  });

  it('stays on studio when Vertex is requested but no Google credential is present', () => {
    expect(selectVertex({ ...fullVertex, hasGoogleCredential: false })).toBe(false);
  });

  it('stays on studio when project+creds exist but Vertex was never requested', () => {
    expect(
      selectVertex({ ...fullVertex, geminiBackend: '', vertexAiEnabled: false }),
    ).toBe(false);
  });
});

describe('authModeFor — each backend uses its own auth', () => {
  it('studio authenticates with a URL API key', () => {
    expect(authModeFor('studio')).toBe('api-key');
  });

  it('vertex authenticates with a Bearer token', () => {
    expect(authModeFor('vertex')).toBe('bearer');
  });
});

describe('vertexEndpointUrl — regional aiplatform endpoint', () => {
  it('builds the URL from project + location + model', () => {
    const url = vertexEndpointUrl('aita-prod', 'us-central1', 'gemini-2.5-pro');
    expect(url).toBe(
      'https://us-central1-aiplatform.googleapis.com/v1/projects/aita-prod/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent',
    );
  });

  it('embeds the region in BOTH the host subdomain and the locations path segment', () => {
    const url = vertexEndpointUrl('p', 'europe-west4', 'gemini-2.5-flash');
    expect(url).toMatch(/^https:\/\/europe-west4-aiplatform\.googleapis\.com\//);
    expect(url).toContain('/locations/europe-west4/');
  });

  it('uses an OAuth-style host (no ?key= query param)', () => {
    const url = vertexEndpointUrl('p', 'us-central1', 'm');
    expect(url).not.toContain('?key=');
    expect(url).not.toContain('generativelanguage.googleapis.com');
  });
});

describe('studioEndpointUrl — default path stays byte-for-byte unchanged', () => {
  it('builds the exact legacy generativelanguage URL with the ?key= API key', () => {
    const url = studioEndpointUrl('gemini-2.5-pro', 'AIzaSecretKey');
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=AIzaSecretKey',
    );
  });

  it('uses the documented STUDIO_BASE constant', () => {
    expect(STUDIO_BASE).toBe('https://generativelanguage.googleapis.com/v1beta/models');
    expect(studioEndpointUrl('m', 'k')).toBe(`${STUDIO_BASE}/m:generateContent?key=k`);
  });

  it('never points at the Vertex aiplatform host', () => {
    expect(studioEndpointUrl('m', 'k')).not.toContain('aiplatform.googleapis.com');
  });
});
