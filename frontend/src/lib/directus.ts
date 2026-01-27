import { createDirectus, rest, staticToken } from '@directus/sdk';
import { 
  Quest, 
  QuestStep, 
  User, 
  UserProgress, 
  School, 
  LuantiWorld 
} from '@/types/schema'; // Stelle sicher, dass UserProgress in schema.d.ts exportiert ist!

// 1. Mapping: Deine Types auf die Directus Collection Namen
// Directus nutzt snake_case (quests), deine Types sind PascalCase (Quest)
interface Schema {
  quests: Quest[];
  quest_steps: QuestStep[];
  directus_users: User[]; // System-Collection
  user_progress: UserProgress[];
  schools: School[];
  luanti_worlds: LuantiWorld[];
}

// 2. Globaler Client-Singleton (für Server Components)
// Wir nutzen caching: 'no-store' per Default für Echtzeit-Daten, 
// oder Next.js natives Caching in den fetch requests.

const directusUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8055';

export const directus = createDirectus<Schema>(directusUrl)
  .with(rest({
    onRequest: (options) => ({ ...options, cache: 'no-store' }), // Deaktiviert Cache für Dev
  }));

/**
 * Helper für Bilder-URLs
 */
export function getAssetUrl(id: string) {
  if (!id) return '';
  return `${directusUrl}/assets/${id}`;
}