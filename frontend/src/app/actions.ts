'use server'

import { createDirectus, rest, readItems, readMe, updateItem, createItem, staticToken } from '@directus/sdk';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { ClaimableToken, UserProgress, QuestStep, UUID } from '@/types/schema';

interface DirectusSchema {
  claimable_tokens: ClaimableToken[];
  user_progress: UserProgress[];
  quest_steps: QuestStep[];
}

// Smart URL Logik für Server/Client-Unterscheidung
const isServer = typeof window === 'undefined';
const API_URL = isServer
  ? (process.env.INTERNAL_API_URL || 'http://directus:8055')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8055');

console.log(`[Directus] Connecting to API at: ${API_URL}`);

export type ActionState = {
  error?: string;
  success?: string;
} | null;

interface DirectusSchema {
  claimable_tokens: ClaimableToken[];
  user_progress: UserProgress[];
}

// --- HELPER: Auth Client ---
async function getAuthenticatedSdk() {
  const cookieStore = await cookies();
  const token = cookieStore.get('directus_token')?.value;
  
  if (!token) {
    console.error('[Auth] Kein Token in Cookies gefunden');
    throw new Error('Nicht autorisiert');
  }

  try {
    return createDirectus<DirectusSchema>(API_URL)
      .with(staticToken(token))
      .with(rest({
        onRequest: (options) => ({
          ...options,
          cache: 'no-store'
        })
      }));
  } catch (err) {
    console.error('[Auth] SDK Initialisierungsfehler:', err);
    throw new Error('API Client Fehler');
  }
}

// --- LOGIN ACTION ---
export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) return { error: 'Bitte Email und Passwort eingeben.' };

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, mode: 'json' }),
      cache: 'no-store'
    });

    const data = await response.json();
    if (!response.ok) return { error: 'Login fehlgeschlagen. Zugangsdaten prüfen.' };

    const result = data.data;
    const cookieStore = await cookies();
    
    cookieStore.set('directus_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });

    if (result.refresh_token) {
      cookieStore.set('directus_refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  } catch (err) {
    return { error: 'Verbindungsfehler zum Backend.' };
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

// --- TOKEN REDEEM ACTION ---
export async function redeemTokenAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const token = formData.get('token') as string;
  const questId = formData.get('questId') as string;

  if (!token || !questId) {
    console.error('[Token Redeem] Fehlende Daten:', { token: !!token, questId: !!questId });
    return { error: 'Daten unvollständig.' };
  }

  try {
    // 1. Auth-Client mit Error-Handling
    const client = await getAuthenticatedSdk();
    
    // 2. User-ID holen (mit Retry bei 401)
    let currentUser;
    try {
      currentUser = await client.request(readMe({ fields: ['id'] })) as { id: UUID };
    } catch (err: any) {
      console.error('[Token Redeem] User-Fehler:', {
        status: err.response?.status,
        message: err.message
      });
      if (err.response?.status === 401) {
        return { error: 'Bitte neu einloggen.' };
      }
      throw err;
    }

    // 3. Token validieren
    console.log('[Token Redeem] Suche Token:', { token, questId });
    const tokens = await client.request(readItems('claimable_tokens', {
      filter: {
        token: { _eq: token },
        is_claimed: { _eq: false },
        quest_id: { _eq: questId }
      }
    }));

    if (!tokens.length) {
      console.warn('[Token Redeem] Token nicht gefunden oder bereits genutzt');
      return { error: 'Code ungültig oder bereits genutzt.' };
    }

    // 4. Token entwerten
    console.log('[Token Redeem] Entwerte Token:', tokens[0].id);
    await client.request(updateItem('claimable_tokens', tokens[0].id, {
      is_claimed: true,
      claimed_by: currentUser.id
    }));

    // 5. Progress erstellen (Backend-Hook übernimmt XP)
    console.log('[Token Redeem] Erstelle Progress');
    // Hole Quest-Step ID für den Token
    const questSteps = await client.request(readItems('quest_steps', {
      filter: {
        quest_id: { _eq: questId },
        completion_token_secret: { _nnull: true }
      }
    }));

    if (!questSteps.length) {
      console.error('[Token Redeem] Kein Quest-Step mit Token gefunden:', { questId });
      return { error: 'Quest-Konfiguration fehlerhaft.' };
    }

    await client.request(createItem('user_progress', {
      status: 'completed',
      token_fragment: token,
      user_id: currentUser.id,
      quest_step_id: questSteps[0].id
    }));

    revalidatePath('/dashboard');
    return { success: 'Quest abgeschlossen! Deine XP werden im Hintergrund aktualisiert.' };

  } catch (error: any) {
    // Detailliertes Error-Logging
    console.error(`[Token Redeem] Fehler bei Anfrage an ${API_URL}:`, {
      status: error.response?.status,
      message: error.message,
      details: error.response?.data
    });

    // Benutzerfreundliche Fehlermeldungen
    if (error.response?.status === 401) {
      return { error: 'Deine Sitzung ist abgelaufen. Bitte neu einloggen.' };
    } else if (error.response?.status === 403) {
      return { error: 'Keine Berechtigung für diese Aktion.' };
    }
    
    return { error: 'Fehler beim Einlösen. Support kontaktieren.' };
  }
}