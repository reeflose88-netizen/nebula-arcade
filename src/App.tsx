/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Home from './pages/Home';
import Creator from './pages/Creator';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  const [page, setPage] = useState<'home' | 'creator'>('home');

  return (
    <AuthProvider>
      <main className="relative pt-16 bg-indigo-950 min-h-screen">
        <Navbar activePage={page} onPageChange={setPage} />
        <AnimatePresence mode="wait">
          {page === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Home />
            </motion.div>
          ) : (
            <motion.div
              key="creator"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Creator />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AuthProvider>
  );
}



