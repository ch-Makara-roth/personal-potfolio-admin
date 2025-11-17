import { addBreadcrumb, reportError } from '@/services/error-reporting';

export const logAuthEvent = (
  event:
    | 'login_start'
    | 'login_success'
    | 'login_failure'
    | 'logout'
    | 'refresh_start'
    | 'refresh_success'
    | 'refresh_failure'
    | 'token_invalid'
    | 'token_valid'
    | 'auth_required',
  data?: Record<string, any>
) => {
  addBreadcrumb({
    category: 'user',
    message: `auth:${event}`,
    level:
      event.includes('failure') || event === 'auth_required' ? 'error' : 'info',
    data,
  });
};

export const reportAuthError = (error: Error, data?: Record<string, any>) => {
  reportError(error, { feature: 'auth', ...data });
};
