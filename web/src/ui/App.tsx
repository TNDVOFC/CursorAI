import React from "react";
import { motion } from "framer-motion";
import { Chat } from "./Chat";

export const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-neutral-800 p-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold">AI Platform</h1>
          <nav className="text-sm opacity-80">Chat · Admin</nav>
        </div>
      </header>
      <motion.main className="flex-1 max-w-5xl mx-auto w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Chat />
      </motion.main>
    </div>
  );
};
