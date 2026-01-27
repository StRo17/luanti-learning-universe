import { directus, getAssetUrl } from "@/lib/directus";
import { readItem, readItems } from "@directus/sdk";
import { notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuestDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    // 1. Quest Daten laden
    const quest = await directus.request(
      readItem('quests', id, {
        fields: ['*', 'date_created'], // Lade alle Felder
      })
    );

    // 2. Schritte laden (Da wir keine O2M Relation im Schema Interface definiert haben, 
    // laden wir sie manuell über den Filter - das ist robuster)
    const steps = await directus.request(
      readItems('quest_steps', {
        filter: {
          quest_id: {
            _eq: id
          }
        },
        sort: ['sort_order', 'sort'] as any, // Sortiere nach Reihenfolge
      })
    );

    return (
      <main className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
        <div className="max-w-3xl mx-auto">
          {/* Navigation zurück */}
          <Link 
            href="/" 
            className="text-slate-400 hover:text-white mb-8 inline-flex items-center gap-2 transition-colors"
          >
            ← Zurück zur Übersicht
          </Link>

          {/* Quest Header */}
          <header className="mb-10 border-b border-slate-800 pb-10">
            <div className="flex gap-3 mb-4">
              <span className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full text-sm font-mono">
                {Array.isArray(quest.subject) ? quest.subject.join(', ') : quest.subject}
              </span>
              <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm font-mono">
                Level {quest.difficulty}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              {quest.title}
            </h1>
            
            <div className="prose prose-invert prose-lg max-w-none text-slate-300">
              {/* Hier könnte man später einen Markdown Renderer einbauen */}
              {quest.description}
            </div>
          </header>

          {/* Steps Liste */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                {steps.length}
              </span>
              Aufgaben
            </h2>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-400">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <div className="text-slate-400 text-sm mb-3">
                      Typ: <span className="uppercase text-xs tracking-wider bg-slate-800 px-2 py-0.5 rounded">{Array.isArray(step.step_type) ? step.step_type[0] : step.step_type}</span>
                    </div>
                    {/* Placeholder für Step-Content */}
                    <p className="text-slate-500 text-sm">
                      {step.content_data ? 'Interaktiver Inhalt verfügbar' : 'Keine zusätzlichen Daten.'}
                    </p>
                  </div>
                </div>
              ))}

              {steps.length === 0 && (
                <div className="p-6 border border-dashed border-slate-800 rounded-xl text-center text-slate-500">
                  Diese Quest hat noch keine Schritte.
                </div>
              )}
            </div>
          </section>

          {/* Action Button */}
          <div className="mt-12 flex justify-end">
            <button className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-green-900/20 transition-all transform hover:scale-105">
              Quest Starten 🚀
            </button>
          </div>
        </div>
      </main>
    );

  } catch (error) {
    // Falls Quest nicht gefunden oder Zugriff verweigert
    console.error("Quest Error:", error);
    notFound();
  }
}