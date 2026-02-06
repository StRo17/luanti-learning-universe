export const dynamic = 'force-dynamic';

import { getAuthClient } from "@/lib/directus";
import { readMe } from "@directus/sdk";
import { redirect } from "next/navigation";
import { logoutAction } from "../actions";

export default async function DashboardPage() {
  const client = await getAuthClient();

  try {
    // Lade Benutzerdaten mit allen Feldern
    const user = await client.request(readMe({ fields: ['*'] }));
    
    // Fallback für nicht initialisierte Benutzerobjekte
    if (!user) {
      throw new Error('Benutzerdaten nicht verfügbar');
    }

    return (
      <main className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-12 border-b border-slate-800 pb-6">
            <div>
              <h1 className="text-3xl font-bold">Hallo, {user.first_name || 'Held'}! 👋</h1>
              <p className="text-slate-400">Willkommen in deinem Hauptquartier.</p>
            </div>
            
            <form action={logoutAction}>
              <button className="text-sm bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-300 px-4 py-2 rounded transition-colors">
                Abmelden
              </button>
            </form>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Stats Card 1 */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Level</div>
              <div className="text-4xl font-bold text-blue-400">1</div>
            </div>
            
            {/* Stats Card 2 */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider">XP Total</div>
              <div className="text-4xl font-bold text-purple-400">{user?.xp_total ?? 0}</div>
            </div>

            {/* Stats Card 3 */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Coins</div>
              <div className="text-4xl font-bold text-yellow-400">{user?.coins_balance ?? 0}</div>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-bold mb-4">Deine aktiven Quests</h2>
            <div className="bg-slate-900/50 rounded-xl p-8 text-center border border-dashed border-slate-800">
              <p className="text-slate-500">Noch keine Quests gestartet.</p>
              <a href="/" className="text-blue-400 hover:underline mt-2 inline-block">
                Neue Quest suchen →
              </a>
            </div>
          </section>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Dashboard Fehler:', error);
    
    // Bei Authentifizierungsfehlern zum Login umleiten
    if (error instanceof Error && error.message.includes('Nicht authentifiziert')) {
      redirect('/login');
    }
    
    // Bei anderen Fehlern Fehlerseite anzeigen
    return (
      <div className="min-h-screen bg-slate-950 text-white p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">⚠️ Systemfehler</h2>
        <p>Dashboard konnte nicht geladen werden. Bitte versuche es später erneut.</p>
      </div>
    );
  }
}