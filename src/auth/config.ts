export const BLACK_LABEL_AUTH_PROJECT_REF = 'xopcttkrmjvwdddawdaa';
export const BLACK_LABEL_AUTH_HOST = `${BLACK_LABEL_AUTH_PROJECT_REF}.supabase.co`;
export const BLACK_LABEL_ACCOUNT_PORTAL_URL = 'https://myblacklabel.app/';
export const BLACK_LABEL_AUTH_STORAGE_KEY = 'black-label-connect-auth-v1';

export function validateSharedAuthUrl(value: string | undefined): string | null {
  if (!value) return 'Set EXPO_PUBLIC_SUPABASE_URL before starting the app.';

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== BLACK_LABEL_AUTH_HOST) {
      return 'Black Label Connect must use the shared Black Label authentication project.';
    }
  } catch {
    return 'EXPO_PUBLIC_SUPABASE_URL must be a valid HTTPS URL.';
  }

  return null;
}
