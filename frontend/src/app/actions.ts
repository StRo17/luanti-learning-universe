'use server'

import { directus } from '@/lib/directus';
import { authentication } from '@directus/sdk';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Client temporär um Auth erweitern
const authClient = directus.with(authentication('json', { autoRefresh: false }));

// Typ-Definition für den State
type LoginState = {
  error?: string;
} | null;

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Bitte Email und Passwort eingeben.' };
  }

  try {
    // FIX: Wir nutzen (authClient.login as any), um den TypeScript-Überladungs-Fehler zu umgehen.
    // Die Funktion erwartet zur Laufzeit (email, password).
    const result = await (authClient.login as any)(email, password);

    if (result.access_token) {
      const cookieStore = await cookies();

      // Access Token
      cookieStore.set('directus_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600, // 1 Stunde
        path: '/',
      });

      // Refresh Token
      if (result.refresh_token) {
        cookieStore.set('directus_refresh_token', result.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 Tage
          path: '/',
        });
      }
    }
  } catch (err: any) {
    console.error("Login Failed:", err);
    // Prüfen ob es ein API Fehler ist
    if (err?.errors?.[0]?.message) {
        return { error: 'Falsche Zugangsdaten.' };
    }
    return { error: 'Login fehlgeschlagen. Serverfehler.' };
  }

  // Redirect bei Erfolg
  redirect('/dashboard');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('directus_token');
  cookieStore.delete('directus_refresh_token');
  redirect('/login');
}