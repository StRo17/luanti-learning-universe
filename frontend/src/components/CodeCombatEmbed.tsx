'use client';

import { useEffect, useState } from 'react';
import { directus } from '@/lib/directus';
import type { ExternalProvider } from '@/types/schema';

interface CodeCombatEmbedProps {
  levelId: string;
  userId: string;
  providerId: string;
}

export default function CodeCombatEmbed({ levelId, userId, providerId }: CodeCombatEmbedProps) {
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadProvider() {
      try {
        // Fetch provider using fetch API directly since we're client-side
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/items/external_providers/${providerId}?filter[status][_eq]=active`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Provider nicht gefunden');
        }

        const provider = await response.json() as ExternalProvider;
        
        if (!provider || provider.status !== 'active') {
          setError('Provider nicht gefunden oder inaktiv');
          return;
        }

        const url = `${provider.base_url}/play/level/${levelId}?user=${userId}`;
        setEmbedUrl(url);

      } catch (err) {
        console.error('Fehler beim Laden des Providers:', err);
        setError('Fehler beim Laden des Providers');
      }
    }

    if (levelId && userId && providerId) {
      loadProvider();
    }
  }, [levelId, userId, providerId]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="p-4 bg-gray-50 animate-pulse">
        Lade CodeCombat...
      </div>
    );
  }

  return (
    <iframe
      src={embedUrl}
      className="w-full h-[600px] border-0 rounded-lg shadow-lg"
      allow="fullscreen"
      title="CodeCombat Level"
    />
  );
}