interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

const CANONICAL_HOST = 'mrselby.app';
const WWW_HOST = `www.${CANONICAL_HOST}`;

export const handleRequest = async (request: Request, env: Env): Promise<Response> => {
  const url = new URL(request.url);
  const isProductionHost = url.hostname === CANONICAL_HOST || url.hostname === WWW_HOST;

  if (isProductionHost && (url.protocol === 'http:' || url.hostname === WWW_HOST)) {
    url.protocol = 'https:';
    url.hostname = CANONICAL_HOST;
    url.port = '';

    return new Response(null, {
      status: 308,
      headers: {
        'Cache-Control': 'public, max-age=3600',
        Location: url.toString(),
      },
    });
  }

  return env.ASSETS.fetch(request);
};

export default {
  fetch: handleRequest,
};
