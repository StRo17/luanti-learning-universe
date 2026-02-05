'use server'

import { directus, getAuthClient } from '@/lib/directus';
import { authentication, readItems, updateItem, createItem } from '@directus/sdk';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// Client temporär um Auth erweitern
const authClient = directus.with(authentication('json', { autoRefresh: false }));

// Typ-Definition für den State
type ActionState = {
  error?: string;
  success?: string;
} | null;

// --- LOGIN ACTION ---
export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Bitte Email und Passwort eingeben.' };
  }

  try {
    // FIX: Expliziter Cast um TS Overload Fehler zu beheben
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
    if (err?.errors?.[0]?.message) {
        return { error: 'Falsche Zugangsdaten.' };
    }
    return { error: 'Login fehlgeschlagen. Serverfehler.' };
  }

  redirect('/dashboard');
}

// --- LOGOUT ACTION ---
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('directus_token');
  cookieStore.delete('directus_refresh_token');
  redirect('/login');
}

// --- TOKEN REDEEM ACTION (NEU!) ---
export async function redeemTokenAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const token = formData.get('token') as string;
  const questId = formData.get('questId') as string;

  if (!token) return { error: 'Bitte Code eingeben!' };

  const client = await getAuthClient();

  try {
    // 1. Token suchen und validieren
    const tokens = await client.request(readItems('claimable_tokens', {
      filter: {
        token: { _eq: token },
        is_claimed: { _eq: false },
        quest_id: { _eq: questId } // Token muss zur Quest gehören
      }
    }));

    if (!tokens || tokens.length === 0) {
      return { error: 'Ungültiger Code oder falsche Quest.' };
    }

    const validToken = tokens[0];

    // 2. Token entwerten
    await client.request(updateItem('claimable_tokens', validToken.id, {
      is_claimed: true,
      // Directus setzt 'claimed_by' automatisch auf den Current User bei update
    }));

    // 3. XP / Progress gutschreiben
    await client.request(createItem('user_progress', {
      status: 'completed',
      token_fragment: token,
      // quest_step_id lassen wir hier null, da es die ganze Quest betrifft
      // user_id wird automatisch gesetzt
    }));

    revalidatePath('/dashboard');
    return { success: 'Quest erfolgreich abgeschlossen! XP gutgeschrieben. 🎉' };

  } catch (error) {
    console.error("Redeem Error:", error);
    return { error: 'Ein Fehler ist aufgetreten. Bitte versuche es später.' };
  }
}