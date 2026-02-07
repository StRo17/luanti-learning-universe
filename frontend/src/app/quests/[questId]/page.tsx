import { directus } from "@/lib/directus";
import { readItem, readItems } from "@directus/sdk";
import { notFound } from "next/navigation";
import Link from "next/link";
import RedeemForm from "./RedeemForm"; 

interface PageProps {
  // Geändert von id zu questId
  params: Promise<{ questId: string }>;
}

export default async function QuestDetailPage({ params }: PageProps) {
  // Geändert von id zu questId
  const { questId } = await params;

  try {
    // 1. Quest Daten laden mit questId
    const quest = await directus.request(
      readItem('quests', questId, {
        fields: ['*'], 
      })
    ) as any;

    // 2. Schritte laden mit questId
    const steps = await directus.request(
      readItems('quest_steps', {
        filter: { quest_id: { _eq: questId } },
        sort: ['id'] as any,
      })
    ) as any[];

    return (
      <main className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
        <div className="max-w-3xl mx-auto">
          <Link 
            href="/" 
            className="text-slate-400 hover:text-white mb-8 inline-flex items-center gap-2 transition-colors"
          >
            ← Zurück zur Übersicht
          </Link>

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
              {quest.description}
            </div>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Aufgaben</h2>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-400">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <div className="text-slate-400 text-sm">
                      Typ: <span className="uppercase text-xs tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                        {Array.isArray(step.step_type) ? step.step_type[0] : step.step_type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {steps.length === 0 && <p className="text-slate-500">Keine Schritte definiert.</p>}
            </div>
          </section>

          {/* questId übergeben */}
          <RedeemForm questId={questId} />

        </div>
      </main>
    );

  } catch (error) {
    console.error("Fehler beim Laden der Quest-Details:", error);
    notFound();
  }
}