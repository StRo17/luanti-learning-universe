'use client'

import { useActionState } from 'react';
import { loginAction } from '../actions'; // Jetzt korrekt (Plural)
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
    >
      {pending ? 'Lade...' : 'Anmelden'}
    </button>
  );
}

export default function LoginPage() {
  // Initial State null setzen
  const [state, formAction] = useActionState(loginAction, null);

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Login</h1>
          <p className="text-slate-400">Luanti Learning Universe</p>
        </div>

        <form action={formAction} className="space-y-6">
          <div>
            <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="email">
              Email Adresse
            </label>
            <input 
              id="email"
              name="email"
              type="email" 
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="password">
              Passwort
            </label>
            <input 
              id="password"
              name="password"
              type="password" 
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">
              {state.error}
            </div>
          )}

          <SubmitButton />
        </form>
      </div>
    </main>
  );
}