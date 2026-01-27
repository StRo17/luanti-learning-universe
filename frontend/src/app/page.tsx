import { directus } from "@/lib/directus";
import { readItems } from "@directus/sdk";
import Link from "next/link"; // <--- WICHTIG: Neuer Import

export default async function HomePage() {
  // 1. Daten holen (Server-Side Fetching)
  const quests = await directus.request(
    readItems('quests', {
      fields: ['id', 'title', 'description', 'difficulty', 'subject'],
      filter: {
        status: {
          _eq: 'published'
        }
      }
    })
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            LUANTI LEARNING UNIVERSE
          </h1>
          <p className="text-slate-400 mt-2">Wähle deine nächste Herausforderung</p>
        </header>

        {/* Quest Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quests.map((quest) => (
            <div 
              key={quest.id} 
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500 transition-colors flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-900/30 text-blue-400 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                  {/* JSON Feld handling */}
                  {Array.isArray(quest.subject) ? quest.subject[0] : quest.subject}
                </span>
                <span className="text-slate-500 text-sm">
                  Lvl {quest.difficulty}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">{quest.title}</h2>
              <div className="text-slate-400 text-sm line-clamp-3 prose prose-invert mb-6 flex-grow">
                {quest.description}
              </div>

              <Link 
                href={`/quests/${quest.id}`}
                className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Start Quest
              </Link>
            </div>
          ))}
        </div>

        {quests.length === 0 && (
          <div className="text-center p-12 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
            <p className="text-slate-400">Keine Quests verfügbar.</p>
            <p className="text-sm text-slate-600">Gehe ins Directus Admin Panel und setze den Status einer Quest auf "Published".</p>
          </div>
        )}
      </div>
    </main>
  );
}