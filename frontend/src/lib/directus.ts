import { createDirectus, rest, authentication, staticToken } from '@directus/sdk';
import { cookies } from 'next/headers'; // Wichtig für Auth
import { 
  Quest, 
  QuestStep, 
  User, 
  UserProgress, 
  School, 
  LuantiWorld 
} from '@/types/schema';

// Schema Definition
export interface Schema {
  quests: Quest[];
  quest_steps: QuestStep[];
  directus_users: User[];
  user_progress: UserProgress[];
  schools: School[];
  luanti_worlds: LuantiWorld[];
}

// URL Definition
const directusUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8055';

// 1. Globaler Public Client (Singleton)
export const directus = createDirectus<Schema>(directusUrl)
  .with(rest({
    onRequest: (options) => ({ ...options, cache: 'no-store' }),
  }));

/**
 * 2. Helper für Bilder-URLs
 */
export function getAssetUrl(id: string) {
  if (!id) return '';
  return `${directusUrl}/assets/${id}`;
}

/**
 * 3. Authentifizierter Client (Server Components)
 * Diese Funktion fehlte dir vorhin!
 */
export async function getAuthClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('directus_token')?.value;

  const client = createDirectus<Schema>(directusUrl)
    .with(rest({
      onRequest: (options) => ({
        ...options,
        headers: {
          ...options.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store', 
      }),
    }));

  return client;
}