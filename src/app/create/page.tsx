'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { ToastContainer, toast } from 'react-toastify';
export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const router = useRouter();
  const notify = () => toast.info('To save cost, the code generation is disabled. Please view the demo video on the home page to see the features in action.', {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark",

  });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    notify();
    return;

    if (prompt.trim()) {
      const encodedPrompt = encodeURIComponent(prompt.trim());
      router.push(`/generate/${encodedPrompt}`);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#0A0A0F] font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"

      />
      {/* Animated glow effect following cursor */}
      <div
        className="fixed w-[500px] h-[500px] rounded-full bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-fuchsia-600/20 blur-[120px] pointer-events-none opacity-60 transition-transform duration-1000 ease-out"
        style={{
          transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
        }}
      />

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars-container">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full opacity-60"
              initial={{
                x: Math.random() * 100 + "%",
                y: Math.random() * 100 + "%",
                scale: Math.random() * 0.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.1,
              }}
              animate={{
                y: [`${Math.random() * 100}%`, `${Math.random() * 90}%`, `${Math.random() * 100}%`],
                opacity: [Math.random() * 0.5 + 0.1, Math.random() * 0.8 + 0.2, Math.random() * 0.5 + 0.1],
              }}
              transition={{
                duration: Math.random() * 5 + 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                filter: `blur(${Math.random() * 1}px)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/30 to-black/80 pointer-events-none"></div>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-2xl"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block">
            <div className="relative z-10 w-24 h-24 mx-auto bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-2xl shadow-lg p-5 transform rotate-3 overflow-hidden">
              <div className="absolute inset-0 bg-grid-subtle opacity-20"></div>
              <Image
                className="w-full h-full"
                src="/studio-logo.svg"
                alt="studio Logo"
                width={80}
                height={80}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20"></div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-cyan-500 rounded-2xl -z-10 transform rotate-6 opacity-80"></div>
            <div className="absolute bottom-1 left-1 w-full h-full bg-purple-700 rounded-2xl -z-20 transform -rotate-3"></div>

            {/* Glow effect */}
            <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl -z-30"></div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl font-bold bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent mt-8 mb-3 drop-shadow-sm tracking-tight"
          >
            Generate Code with AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-gray-300 mb-10 max-w-md mx-auto text-lg"
          >
            Build your websites with AI and deploy it with a single click to custom domain.
          </motion.p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-gray-800/70 to-gray-900/90 backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.5)] border border-gray-700/50"
        >
          {/* Card top light effect */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

          {/* Card content */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
              <motion.div
                whileTap={{ scale: 0.995 }}
                className="w-full"
              >
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'a portfolio website for a software engineer' or 'a landing page for my coffee shop'"
                  className="w-full px-5 py-4 bg-gray-900/90 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 shadow-inner text-lg transition-all duration-200 resize-none"
                  required
                  rows={4}
                />
                {/* Input highlight effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent opacity-0 hover:opacity-100 rounded-xl pointer-events-none transition-opacity duration-1000"></div>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="w-full group bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium px-8 py-3 rounded-xl shadow-lg transition-all duration-200 text-base flex items-center justify-center gap-3 disabled:opacity-50 relative overflow-hidden"
                disabled={!prompt.trim()}
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform group-hover:translate-x-full ease-out"></div>

                {/* Icon wrapper with glow */}
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-400/30 rounded-full blur-md animate-pulse"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 relative z-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L24 5.25l-.813 2.846a4.5 4.5 0 0 0-3.09 3.09L18.25 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09L12 18.75l.813-2.846a4.5 4.5 0 0 0 3.09-3.09L18.25 12Z" />
                  </svg>
                </div>

                Generate
              </motion.button>
            </form>
          </div>
        </motion.div>
      </motion.main>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="relative mt-12 w-full max-w-2xl px-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: "🚀", title: "Fast", desc: "Get code in seconds" },
            { icon: "✨", title: "Smart", desc: "AI-powered solutions" },
            { icon: "🔧", title: "Customizable", desc: "Adapt to your needs" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + (i * 0.1), duration: 0.5 }}
              className="bg-gray-800/40 backdrop-blur-sm p-4 rounded-xl border border-gray-700/30 text-center"
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="text-white font-medium">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <footer className="relative mt-10 text-center text-gray-500 text-sm pb-8">
        <div className="flex flex-col items-center">
          <p className="mb-2">
            Powered by <span className="font-semibold text-indigo-400">Code Studio AI</span>
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p className="text-gray-400 font-medium">Contributors of Code Studio AI</p>
            <div className="flex items-center justify-center gap-3">
              <a
                href="https://github.com/Sami-07"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-400 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Shaikh Abdul Sami
              </a>
              <span className="text-gray-600">•</span>
              <a
                href="https://github.com/AdityaSaxena17"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-400 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Aditya Saxena
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Add CSS for grid patterns */}
      <style jsx global>{`
        .bg-grid-pattern {
          background-size: 20px 20px;
          background-image: linear-gradient(to right, rgb(71, 85, 105, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgb(71, 85, 105, 0.1) 1px, transparent 1px);
        }
        
        .bg-grid-subtle {
          background-size: 10px 10px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
}
