import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Rocket, Sparkles, Users, RotateCcw } from 'lucide-react';
import GameCard from '../components/GameCard';
import GameRunner from '../components/GameRunner';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { GameMetadata } from '../types';

export default function Home() {
  const [games, setGames] = useState<GameMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<GameMetadata | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'games'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const g = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GameMetadata));
      setGames(g);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'games');
    });

    return () => unsubscribe();
  }, []);

  const handlePlay = async (game: GameMetadata) => {
    setActiveGame(game);
    // Track play count
    try {
      const gameRef = doc(db, 'games', game.id);
      await updateDoc(gameRef, { plays: increment(1) });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `games/${game.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-950 text-white overflow-hidden pb-24">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center px-6">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-950 z-10" />
          <img 
            src="/src/assets/images/nebula_arcade_hero_1778829271811.png" 
            alt="Nebula Arcade Hero" 
            className="w-full h-full object-cover opacity-40 grayscale-[20%] brightness-75"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-20 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6">
              <span className="px-3 py-1 bg-indigo-800 text-pink-400 rounded-lg text-xs font-bold uppercase tracking-widest border border-indigo-400/20">Zero Coding Required</span>
            </div>
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase mb-6 leading-[0.85] font-sans text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-300">
              PLAY.<br />CREATE.<br />REPEAT.
            </h1>
            <p className="text-lg md:text-xl text-indigo-200 mb-10 max-w-2xl mx-auto font-sans leading-relaxed">
              The ultimate playground for browser gaming. 
              Join creators turning wild ideas into instant-play experiences with AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => {
                  const el = document.getElementById('discover');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-pink-500 rounded-2xl font-black text-lg shadow-xl shadow-pink-500/40 hover:scale-105 transform transition group"
              >
                Jump In
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Features Banner */}
      <section className="py-20 border-y border-indigo-500/20 bg-indigo-900 shadow-inner">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Instant Games', value: games.length.toString(), icon: Gamepad2, color: 'text-cyan-400' },
            { label: 'Creators', value: '12K+', icon: Users, color: 'text-pink-500' },
            { label: 'Assets', value: '1.2M', icon: Rocket, color: 'text-yellow-400' },
            { label: 'No Coding', value: '100%', icon: Sparkles, color: 'text-green-400' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <stat.icon className={`w-6 h-6 mx-auto mb-3 ${stat.color}`} />
              <div className="text-3xl font-black mb-1">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Discovery Section */}
      <section id="discover" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Editor's Choice</h2>
            <p className="text-indigo-400 font-medium">Hand-picked cosmic experiences from the community</p>
          </div>
          <button className="text-xs uppercase tracking-widest font-black text-pink-400 hover:text-pink-300 transition-colors">
            View All Games
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
             <RotateCcw className="w-8 h-8 animate-spin text-cyan-500" />
             <p className="uppercase tracking-widest text-xs font-bold">Scanning Sector...</p>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {games.map((game) => (
              <motion.div
                key={game.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
              >
                <GameCard 
                  game={game} 
                  onPlay={() => handlePlay(game)} 
                />
              </motion.div>
            ))}
            {games.length === 0 && (
              <motion.div 
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1 }
                }}
                className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10"
              >
                <p className="text-gray-500 uppercase tracking-widest text-sm">No transmissions detected. Be the first to forge a world.</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </section>

      <AnimatePresence>
        {activeGame && (
          <GameRunner 
            config={(activeGame as any).config} 
            onClose={() => setActiveGame(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
