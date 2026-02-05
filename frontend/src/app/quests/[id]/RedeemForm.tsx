'use client';

import { useActionState } from 'react';
import { redeemTokenAction } from '../../actions'; // Geht 2 Ordner hoch zu actions.ts

export default function RedeemForm({ questId }: { questId: string }) {
  const [state, formAction, isPending] = useActionState(redeemTokenAction, null);

  return (
    <div className="bg-slate-900/80 p-8 rounded-2xl border border-blue-500/30 mt-12 shadow-xl">
      <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
        🏆 Quest Abschließen
      </h3>
      <p className="text-slate-400 mb-6">
        Hast du die Aufgabe in Luanti gelöst? Gib deinen 6-stelligen Code ein:
      </p>

      <form action={formAction} className="flex flex-col md:flex-row gap-4">
        <input type="hidden" name="questId" value={questId} />
        <input 
          name="token"
          type="text" 
          placeholder="CODE (z.B. X7K9)"
          required
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-4 text-white font-mono text-xl tracking-widest uppercase text-center md:text-left focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg shadow-green-900/20 transition-all"
        >
          {isPending ? 'Prüfe...' : 'Code Prüfen'}
        </button>
      </form>

      {/* FEEDBACK MESSAGES */}
      {state?.error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg text-center font-bold">
          ❌ {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mt-4 p-4 bg-green-900/50 border border-green-500/50 text-green-200 rounded-lg text-center font-bold">
          {state.success}
        </div>
      )}
    </div>
  );
}