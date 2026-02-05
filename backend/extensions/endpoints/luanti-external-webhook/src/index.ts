import { defineEndpoint } from '@directus/extensions-sdk';

export default defineEndpoint((router, context) => {
    const { services, database, getSchema } = context;
    const { ItemsService } = services;

    router.post('/:providerId', async (req, res) => {
        const { providerId } = req.params;
        const payload = req.body;
        
        // CodeCombat Daten-Extraktion (Mapping)
        const extUserId = payload.properties?.userID || payload.user_id;
        const extLevelId = payload.properties?.levelID || payload.level_id;

        try {
            const webhookSecret = req.headers['x-webhook-secret'];
            const schema = await getSchema();
            
            // 1. Provider validieren
            const providerService = new ItemsService('external_providers', { schema, knex: database });
            const provider = await providerService.readOne(providerId);

            if (!provider || provider.webhook_secret !== webhookSecret) {
                return res.status(401).json({ error: 'Invalid secret or provider' });
            }

            // 2. User finden
            const progressService = new ItemsService('external_progress', { schema, knex: database });
            const existingProgress = await progressService.readByQuery({
                filter: { external_user_id: { _eq: extUserId } },
                limit: 1
            });

            if (!existingProgress.length) {
                return res.status(404).json({ error: 'User mapping missing' });
            }
            const userId = existingProgress[0].user_id;

            // 3. Fortschritt speichern
            await progressService.createOne({
                user_id: userId,
                provider_id: providerId,
                external_user_id: extUserId,
                external_level_id: extLevelId,
                status: 'completed'
            });

            // 4. XP-Gutschrift via user_progress
            const userProgressService = new ItemsService('user_progress', { schema, knex: database });
            await userProgressService.createOne({
                user_id: userId,
                status: 'completed'
            });

            return res.status(200).json({ success: true, message: 'XP awarded' });
        } catch (error: any) {
            console.error('[Webhook Error]', error);
            return res.status(500).json({ error: error.message });
        }
    });
});