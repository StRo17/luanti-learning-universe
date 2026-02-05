import { defineEndpoint } from '@directus/extensions-sdk';
export default defineEndpoint((router, context) => {
    const { services, database, getSchema } = context;
    const { ItemsService } = services;
    router.post('/:providerId', async (req, res) => {
        const { providerId } = req.params;
        const payload = req.body;
        try {
            // 1. Validiere Webhook Secret
            const webhookSecret = req.headers['x-webhook-secret'];
            const schema = await getSchema();
            const providerService = new ItemsService('external_providers', {
                schema,
                knex: database,
            });
            const provider = await providerService.readOne(providerId);
            if (!provider || provider.webhook_secret !== webhookSecret) {
                return res.status(401).json({
                    error: 'Invalid webhook secret'
                });
            }
            // 2. Finde User via external_progress
            const progressService = new ItemsService('external_progress', {
                schema,
                knex: database,
            });
            const existingProgress = await progressService.readByQuery({
                filter: {
                    provider_id: { _eq: providerId },
                    external_user_id: { _eq: payload.user_id }
                },
                limit: 1
            });
            if (!existingProgress.length) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }
            const userId = existingProgress[0].user_id;
            // 3. Erstelle external_progress Eintrag
            await progressService.createOne({
                user_id: userId,
                provider_id: providerId,
                external_user_id: payload.user_id,
                external_level_id: payload.level_id,
                status: payload.status,
                date_completed: new Date().toISOString()
            });
            // 4. Finde zugehörigen Quest-Step
            const questStepsService = new ItemsService('quest_steps', {
                schema,
                knex: database,
            });
            const questSteps = await questStepsService.readByQuery({
                filter: {
                    provider_id: { _eq: providerId },
                    external_id: { _eq: payload.level_id }
                },
                limit: 1
            });
            if (!questSteps.length) {
                return res.status(200).json({
                    message: 'Progress recorded (no quest step found)'
                });
            }
            // 5. Erstelle user_progress Eintrag (triggert XP-Hook)
            const userProgressService = new ItemsService('user_progress', {
                schema,
                knex: database,
            });
            await userProgressService.createOne({
                user_id: userId,
                quest_step_id: questSteps[0].id,
                status: payload.status,
                date_created: new Date().toISOString()
            });
            return res.status(200).json({
                message: 'Progress recorded and XP awarded'
            });
        }
        catch (error) {
            console.error('[External Webhook]', error);
            return res.status(500).json({
                error: 'Internal server error',
                details: error.message
            });
        }
    });
});
