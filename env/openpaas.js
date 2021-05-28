window.openpaas = {
  // AUTH_PROVIDER: 'basic'
  OPENPAAS_API_URL: 'http://backend.open-paas.org.local',
  AUTH_PROVIDER: 'oidc',
  AUTH_PROVIDER_SETTINGS: {
    authority: 'http://auth.open-paas.org.local/auth/realms/master',
    client_id: 'openpaas',
    redirect_uri: 'http://localhost:9900/PREFIX_PLACEHOLDER/auth/oidc/callback',
    silent_redirect_uri: 'http://localhost:9900/PREFIX_PLACEHOLDER/auth/silent-renew.html',
    post_logout_redirect_uri: 'http://localhost:9900/',
    response_type: 'code',
    scope: 'openid email profile'
  }
};
