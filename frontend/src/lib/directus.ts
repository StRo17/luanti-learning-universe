import { createDirectus, rest, staticToken } from '@directus/sdk';
import type { 
  Quest, 
  QuestStep, 
  User, 
  UserProgress, 
  School, 
  LuantiWorld,
  ClaimableToken 
} from '@/types/schema';

// --- SMART URL LOGIK ---
const isServer = typeof window === 'undefined';
// Server nutzt internes Docker-Netz (directus:8055), Browser nutzt localhost:8055
const directusUrl = isServer 
  ? (process.env.DIRECTUS_URL_INTERNAL || 'http://directus:8055')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8055');

// Schema Definition (beibehalten)
export interface Schema {
  quests: Quest[];
  quest_steps: QuestStep[];
  directus_users: User[];
  user_progress: UserProgress[];
  schools: School[];
  luanti_worlds: LuantiWorld[];
  claimable_tokens: ClaimableToken[];
}

// 1. Globaler Public Client
export const directus = createDirectus<Schema>(directusUrl)
  .with(rest({
    onRequest: (options) => ({ ...options, cache: 'no-store' }),
  }));

/**
 * 2. Helper für Bilder-URLs
 */
export function getAssetUrl(id: string) {
  if (!id) return '';
  // Assets werden IMMER über die Public URL geladen (vom Browser des Schülers)
  const publicUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8055';
  return `${publicUrl}/assets/${id}`;
}

/**
 * 3. Authentifizierter Client (Server Components & Actions)
 */
export async function getAuthClient(token?: string) {
  if (!token) {
    throw new Error('Nicht authentifiziert');
  }

  const client = createDirectus<Schema>(directusUrl)
    .with(staticToken(token))
    .with(rest({
      onRequest: (options) => ({
        ...options,
        cache: 'no-store',
      })
    }));

  return client;
}