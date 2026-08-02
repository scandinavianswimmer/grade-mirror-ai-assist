import { describe, expect, it, vi } from 'vitest';

import { handleRequest } from '../worker/cloudflare';

const createEnv = () => ({
  ASSETS: {
    fetch: vi.fn(async () => new Response('asset response')),
  },
});

describe('Cloudflare canonical-host Worker', () => {
  it('redirects the production HTTP origin to HTTPS', async () => {
    const env = createEnv();
    const response = await handleRequest(new Request('http://mrselby.app/privacy?source=test'), env);

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://mrselby.app/privacy?source=test');
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it('redirects www to the canonical apex while preserving path, query, and hash', async () => {
    const env = createEnv();
    const response = await handleRequest(
      new Request('https://www.mrselby.app/terms?source=test#details'),
      env,
    );

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(
      'https://mrselby.app/terms?source=test#details',
    );
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it('serves canonical HTTPS requests from the static asset binding', async () => {
    const env = createEnv();
    const request = new Request('https://mrselby.app/');
    const response = await handleRequest(request, env);

    expect(await response.text()).toBe('asset response');
    expect(env.ASSETS.fetch).toHaveBeenCalledOnce();
    expect(env.ASSETS.fetch).toHaveBeenCalledWith(request);
  });

  it('does not redirect local or workers.dev previews', async () => {
    const env = createEnv();
    const response = await handleRequest(new Request('http://localhost:8787/pitch'), env);

    expect(await response.text()).toBe('asset response');
    expect(env.ASSETS.fetch).toHaveBeenCalledOnce();
  });
});
