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

        // Services initialisieren
        const questService = new ItemsService('quests', { schema, database });
        const userService = new UsersService({ schema, database });
        const progressService = new ItemsService('user_progress', { schema, database });
        const ledgerService = new ItemsService('xp_ledger', { schema, database });

        try {
            // 1. Hole Quest-Daten
            const progress = await progressService.readOne(key, {
                fields: ['quest_step_id.quest_id.id', 'quest_step_id.quest_id.difficulty', 'source']
            });

            if (!progress || !progress.quest_step_id?.quest_id?.id) {
                throw new Error('Quest nicht gefunden');
            }

            const questId = progress.quest_step_id.quest_id.id;
            const difficulty = progress.quest_step_id.quest_id.difficulty?.toLowerCase() || 'easy';
            const reward = XP_REWARDS[difficulty] || XP_REWARDS.easy;

            // 2. Lade User-Daten für Coins-Balance
            const user = await userService.readOne(payload.user_id, {
                fields: ['id', 'coins_balance']
            });

            // 3. Prüfe auf Lehrer-Event Cooldown
            if (progress.source === 'teacher_block') {
                const eventCheck = await ledgerService.readByQuery({
                    filter: {
                        user_id: { _eq: payload.user_id },
                        quest_id: { _eq: questId },
                        source: { _eq: 'teacher_block' }
                    }
                });

                if (eventCheck.length > 0) {
                    console.log(`[XP-Hook] Lehrer-Event ${questId} für User ${payload.user_id} bereits abgeschlossen`);
                    return;
                }
            }

            try {
                await ledgerService.createOne({
                    user_id: payload.user_id,
                    quest_id: questId,
                    amount: reward.xp,
                    source: progress.source || 'quest'
                });
            } catch (error: any) {
                if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('unique constraint')) {
                    console.log(`[XP-Hook] Duplikat erkannt: Quest ${questId} für User ${payload.user_id} bereits abgeschlossen`);
                    return; // Keine weitere Verarbeitung
                }
                throw error;
            }

            // 4. Aggregiere XP aus Ledger
            const aggregation = await ledgerService.sum(payload.user_id, 'amount');
            const totalXP = aggregation?.data?.[0]?.sum?.amount || 0;

            // 5. Aktualisiere User
            await userService.updateOne(payload.user_id, {
                xp_total: totalXP,
                coins_balance: (Number(user.coins_balance) || 0) + reward.coins
            });

            console.log(`[XP-Hook] +${reward.xp} XP für User ${payload.user_id}`);
        } catch (error) {
            console.error('[XP-Hook] Fehler:', error);
        }
    });
});