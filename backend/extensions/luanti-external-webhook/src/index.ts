import { defineEndpoint } from '@directus/extensions-sdk';

export default defineEndpoint((router, context) => {
    const { services, database, getSchema } = context;
    const { ItemsService } = services;

    router.post('/:providerId', async (req, res) => {
        console.log(">>> FINAL_WH_CHECK_V3.2 (DUAL-TYPE-FIX) <<<");
        const { providerId } = req.params;
        const payload = req.body;

        const extUserId = payload.properties?.userID || payload.user_id || payload.userId || "unknown_user";
        const extLevelId = payload.properties?.levelID || payload.level_id || payload.levelId || "unknown_level";

        try {
            const schema = await getSchema();
            const serviceOptions = { schema, knex: database };

            const progressService = new ItemsService('external_progress', serviceOptions);
            const mappings = await progressService.readByQuery({
                filter: { external_user_id: { _eq: extUserId } },
                limit: 1
            });

            if (!mappings.length) return res.status(404).json({ error: "User mapping not found" });
            const internalUserId = mappings[0].user_id;

            // 1. external_progress: Erwartet einen STRING (completed)
            await progressService.createOne({
                user_id: internalUserId,
                provider_id: providerId,
                external_user_id: String(extUserId),
                external_level_id: String(extLevelId),
                status: 'completed' // <--- STRING für VARCHAR Spalte
            });

            // 2. user_progress: Erwartet ein ARRAY (['completed'])
            const userProgressService = new ItemsService('user_progress', serviceOptions);
            await userProgressService.createOne({
                user_id: internalUserId,
                status: ['completed'] // <--- ARRAY für JSON Spalte
            });

            console.log(`>>> V3.2: ERFOLG für User ${internalUserId}`);
            return res.status(200).json({ success: true });

        } catch (err: any) {
            console.error(">>> V3.2 DB-ERROR:", err.message);
            return res.status(500).json({ error: err.message });
        }
    });
});