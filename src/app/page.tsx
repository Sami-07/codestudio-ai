'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      const encodedPrompt = encodeURIComponent(prompt.trim());
      router.push(`/generate/${encodedPrompt}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-4 font-[family-name:var(--font-geist-sans)]">
      <main className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 text-center">
        <Image
          className="mx-auto mb-6"
          src="/studio-logo.svg"
          alt="studio Logo"
          width={80}
          height={80}
          priority
        />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Generate Code with AI</h1>
        <p className="text-gray-600 mb-8">Describe the application or component you want to build.</p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'a simple counter component' or 'a login form'"
            className="flex-grow px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-md transition-colors duration-200 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={!prompt.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L24 5.25l-.813 2.846a4.5 4.5 0 0 0-3.09 3.09L18.25 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09L12 18.75l.813-2.846a4.5 4.5 0 0 0 3.09-3.09L18.25 12Z" />
            </svg>
            Generate
          </button>
        </form>
      </main>
      <footer className="mt-8 text-center text-gray-500 text-sm">
        Powered by studio AI
      </footer>
    </div>
  );
}
