'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAuthClient } from '@/lib/directus';
import { readItem, readMe } from '@directus/sdk';
import type { QuestStep, User } from '@/types/schema';
import CodeCombatEmbed from '@/components/CodeCombatEmbed';
import { getCookie } from 'cookies-next';

export default function QuestStepPage() {
  const params = useParams();
  const [step, setStep] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = getCookie('directus_token') as string;
        const client = await getAuthClient(token);
        
        const [stepData, userData] = await Promise.all([
          // Quest Step mit Provider
          client.request(readItem('quest_steps', params.stepId as string, {
            fields: ['*', 'provider_id.*']
          })) as any,
          
          // Current User
          client.request(readMe({
            fields: ['id', 'email', 'first_name']
          })) as any
        ]);

        setStep(stepData);
        setCurrentUser(userData);

      } catch (err: any) {
        console.error('[Quest Step] Loading error:', err);
        setError(err.message || 'Fehler beim Laden des Quest-Steps');
      }
    };

    loadData();
  }, [params.stepId]);

  // Loading State
  if (!step || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-center p-4">
          <p className="font-semibold">Fehler</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Render CodeCombat Embed wenn external_id und provider vorhanden
  if (step.external_id && step.provider_id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">{step.title}</h1>
        
        {step.content && (
          <div className="prose max-w-none mb-8" 
               dangerouslySetInnerHTML={{ __html: step.content }} 
          />
        )}

        <CodeCombatEmbed
          levelId={step.external_id}
          providerId={step.provider_id.id}
          userId={currentUser.id}
        />
      </div>
    );
  }

  // Fallback für normale Quest-Steps
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{step.title}</h1>
      
      {step.content && (
        <div className="prose max-w-none"
             dangerouslySetInnerHTML={{ __html: step.content }}
        />
      )}
    </div>
  );
}