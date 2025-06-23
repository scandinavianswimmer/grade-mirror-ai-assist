
import { supabase } from './supabase';

export const CANVAS_OAUTH_CONFIG = {
  clientId: import.meta.env.VITE_CANVAS_CLIENT_ID,
  redirectUri: `${window.location.origin}/lms/callback`,
  scopes: [
    'url:GET|/api/v1/courses',
    'url:GET|/api/v1/courses/:course_id/assignments',
    'url:GET|/api/v1/assignments/:assignment_id/submissions',
    'url:POST|/api/v1/submissions/:submission_id/comments',
    'url:PUT|/api/v1/submissions/:submission_id'
  ].join(' ')
};

export const generateCanvasAuthUrl = (canvasUrl: string): string => {
  const params = new URLSearchParams({
    client_id: CANVAS_OAUTH_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: CANVAS_OAUTH_CONFIG.redirectUri,
    scope: CANVAS_OAUTH_CONFIG.scopes,
    state: crypto.randomUUID() // CSRF protection
  });

  return `${canvasUrl}/login/oauth2/auth?${params.toString()}`;
};

export const exchangeCodeForToken = async (
  code: string,
  canvasUrl: string,
  userId: string
): Promise<void> => {
  const tokenUrl = `${canvasUrl}/login/oauth2/token`;
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CANVAS_OAUTH_CONFIG.clientId,
      client_secret: import.meta.env.VITE_CANVAS_CLIENT_SECRET,
      redirect_uri: CANVAS_OAUTH_CONFIG.redirectUri,
      code: code
    })
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  const tokenData = await response.json();

  // Store integration in database
  await supabase
    .from('lms_integrations')
    .upsert({
      user_id: userId,
      platform: 'canvas',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      canvas_url: canvasUrl,
      status: 'connected'
    }, {
      onConflict: 'user_id,platform'
    });
};

export const disconnectCanvas = async (userId: string): Promise<void> => {
  await supabase
    .from('lms_integrations')
    .update({ status: 'disconnected' })
    .eq('user_id', userId)
    .eq('platform', 'canvas');
};
