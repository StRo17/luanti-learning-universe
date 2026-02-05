import type { Router } from 'express';
import { defineEndpoint } from '@directus/extensions-sdk';
import type { 
  ExternalProvider, 
  ExternalProgress, 
  UserProgress, 
  ServiceConfig,
  ItemsService 
} from './types.js';

interface WebhookBody {
  user_id: string;
  level_id: string;
  status: 'completed' | 'failed';
}

export default defineEndpoint((router: Router, { services, database, getSchema }) => {
  const { ItemsService } = services;

  router.post('/:providerId', async (req, res) => {
    const { providerId } = req.params;
    const webhookSecret = req.headers['x-webhook-secret'];
    const body = req.body as WebhookBody;

    try {
      // 1. Provider & Secret validieren
      const providerService = new ItemsService('external_providers', {
        schema: await getSchema(),
        knex: database
      });
      
      const provider = await providerService.readOne(providerId) as ExternalProvider;
      if (!provider || provider.status !== 'active') {
        return res.status(404).json({ error: 'Provider not found or inactive' });
      }

      if (provider.webhook_secret !== webhookSecret) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
      }

      // 2. External Progress erstellen
      const externalProgressService = new ItemsService('external_progress', {
        schema: await getSchema(),
        knex: database
      });

      const externalProgress: Partial<ExternalProgress> = {
        provider_id: providerId,
        external_user_id: body.user_id,
        external_level_id: body.level_id,
        status: body.status,
        date_completed: new Date().toISOString()
      };

      await externalProgressService.createOne(externalProgress);

      // 3. Quest Step finden und User Progress erstellen
      const questStepsService = new ItemsService('quest_steps', {
        schema: await getSchema(),
        knex: database
      });

      const matchingSteps = await questStepsService.readByQuery({
        filter: {
          provider_id: providerId,
          external_id: body.level_id
        }
      });

      if (matchingSteps && matchingSteps.length > 0) {
        const userProgressService = new ItemsService('user_progress', {
          schema: await getSchema(),
          knex: database
        });

        const userProgress: Partial<UserProgress> = {
          user_id: body.user_id,
          quest_step_id: matchingSteps[0].id,
          status: body.status,
          date_created: new Date().toISOString()
        };

        await userProgressService.createOne(userProgress);
      }

      res.status(200).json({ success: true });

    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
});