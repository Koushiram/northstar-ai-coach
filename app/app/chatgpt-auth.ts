import { headers } from 'next/headers';

export type ChatGPTUser = { userId: string; displayName: string; email: string };

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  const userId = requestHeaders.get('oai-authenticated-user-id');
  const email = requestHeaders.get('oai-authenticated-user-email');
  if (!userId || !email) return null;
  const encodedName = requestHeaders.get('oai-authenticated-user-full-name');
  const encoding = requestHeaders.get('oai-authenticated-user-full-name-encoding');
  let displayName = email;
  if (encodedName && encoding === 'percent-encoded-utf-8') {
    try { displayName = decodeURIComponent(encodedName); } catch { displayName = email; }
  }
  return { userId, email, displayName };
}

export function chatGPTSignInPath(returnTo = '/'): string {
  const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
  return `/signin-with-chatgpt?return_to=${encodeURIComponent(safeReturnTo)}`;
}

