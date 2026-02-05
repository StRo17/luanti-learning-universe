import { defineHook } from '@directus/extensions-sdk';

const XP_REWARDS: Record<string, { xp: number, coins: number }> = {
    easy: { xp: 10, coins: 1 },
    medium: { xp: 30, coins: 3 },
    hard: { xp: 50, coins: 10 },
};

export default defineHook(({ action }, { services }) => {
    const { ItemsService, UsersService } = services;

    // Trigger: Wenn ein Fortschritt auf 'completed' gesetzt wird
    action('user_progress.items.create', async ({ payload, key }, { schema, database }) => {
        if (payload.status !== 'completed' || !payload.user_id) return;

        // Wir nutzen den Admin-Account für interne Updates
        const questService = new ItemsService('quests', { schema, database });
        const userService = new UsersService({ schema, database });
        const progressService = new ItemsService('user_progress', { schema, database });

        try {
            // 1. Hole Quest-ID über den Quest-Step (Relation auflösen)
            // Hinweis: Der payload enthält oft nur IDs, wir brauchen die Daten der Quest
            const progress = await progressService.readOne(key, {
                fields: ['quest_step_id.quest_id.difficulty']
            });

            const difficulty = progress?.quest_step_id?.quest_id?.difficulty?.toLowerCase() || 'easy';
            const reward = XP_REWARDS[difficulty] || XP_REWARDS.easy;

            // 2. User laden
            const user = await userService.readOne(payload.user_id, {
                fields: ['id', 'xp_total', 'coins_balance']
            });

            // 3. XP und Coins addieren
            await userService.updateOne(payload.user_id, {
                xp_total: (Number(user.xp_total) || 0) + reward.xp,
                coins_balance: (Number(user.coins_balance) || 0) + reward.coins
            });

            console.log(`[XP-Hook] +${reward.xp} XP für User ${payload.user_id}`);
        } catch (error) {
            console.error('[XP-Hook] Fehler:', error);
        }
    });
});