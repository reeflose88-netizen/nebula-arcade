import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Play, Save, RotateCcw, Wand2, Terminal, Rocket } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import GameRunner from '../components/GameRunner';
import { GameConfig } from '../types';
import { auth, db, signInWithGoogle, handleFirestoreError, OperationType } from '../lib/firebase';

const GAME_ENTITY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["box", "sphere", "capsule"] },
    position: { 
      type: Type.ARRAY, 
      items: { type: Type.NUMBER },
      minItems: 3,
      maxItems: 3
    },
    scale: { type: Type.NUMBER },
    color: { type: Type.STRING },
    material: {
      type: Type.OBJECT,
      properties: {
        metalness: { type: Type.NUMBER },
        roughness: { type: Type.NUMBER },
        transmission: { type: Type.NUMBER },
        thickness: { type: Type.NUMBER },
      }
    },
    emissive: {
      type: Type.OBJECT,
      properties: {
        color: { type: Type.STRING },
        intensity: { type: Type.NUMBER },
      }
    }
  }
};

const GAME_CONFIG_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    physics: {
      type: Type.OBJECT,
      properties: {
        gravity: { type: Type.NUMBER },
        friction: { type: Type.NUMBER },
        bounce: { type: Type.NUMBER },
      }
    },
    player: {
      ...GAME_ENTITY_SCHEMA,
      properties: {
        ...GAME_ENTITY_SCHEMA.properties,
        speed: { type: Type.NUMBER },
        jumpStrength: { type: Type.NUMBER },
      }
    },
    entities: {
      type: Type.ARRAY,
      items: GAME_ENTITY_SCHEMA
    },
    environment: {
      type: Type.OBJECT,
      properties: {
        ambientLight: { type: Type.NUMBER },
        skyColor: { type: Type.STRING },
        groundColor: { type: Type.STRING },
        particleDensity: { type: Type.NUMBER },
        fogDensity: { type: Type.NUMBER },
      }
    },
    vfx: {
      type: Type.OBJECT,
      properties: {
        bloom: {
          type: Type.OBJECT,
          properties: {
            threshold: { type: Type.NUMBER },
            strength: { type: Type.NUMBER },
            radius: { type: Type.NUMBER },
          }
        },
        chromaticAberration: { type: Type.NUMBER },
        exposure: { type: Type.NUMBER },
        distortion: {
          type: Type.OBJECT,
          properties: {
            speed: { type: Type.NUMBER },
            scale: { type: Type.NUMBER },
            strength: { type: Type.NUMBER },
          }
        }
      }
    },
    objective: {
      type: Type.STRING,
      description: "A short text describing what the player must do"
    }
  },
  required: ["physics", "player", "entities", "environment", "vfx", "objective"]
};

export default function Creator() {
  const [prompt, setPrompt] = useState('');
  const [isForging, setIsForging] = useState(false);
  const [isVibing, setIsVibing] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Welcome to Nebula Forge.', 'System ready for 3D synthesis...']);
  const [vibeHistory, setVibeHistory] = useState<{ prompt: string; config: GameConfig }[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), `> ${msg}`]);

  const handleForge = async () => {
    if (!prompt) return;
    setIsForging(true);
    addLog(`Synthesizing 3D World: ${prompt.substring(0, 20)}...`);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a professional 3D game configuration for: ${prompt}. Objective must be short. Colors must be hex. Physics for gravity should be around 9.8. Material properties (metalness, roughness) between 0 and 1. VFX bloom strength between 0 and 3. Return valid JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: GAME_CONFIG_SCHEMA
        }
      });

      const config = JSON.parse(response.text || '{}');
      setGameConfig(config);
      setVibeHistory([{ prompt: 'Initial Genesis', config }]);
      addLog("Logic synthesis complete. Engine ready.");
    } catch (error) {
      addLog("Critical failure in neural core.");
      console.error(error);
    } finally {
      setIsForging(false);
    }
  };

  const handleVibeShift = async (vibe: string, targetIds?: string[]) => {
    if (!gameConfig) return;
    setIsVibing(true);
    addLog(`Injecting Vibe Delta: ${vibe} ${targetIds ? `(Targets: ${targetIds.join(', ')})` : ''}`);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Role: Lead Vibe-Coder for Nebula Arcade.
          Objective: Shift the current 3D game configuration based on this vibe: "${vibe}".
          ${targetIds ? `URGENT: Target specifically the entities with IDs: [${targetIds.join(', ')}]. If any target is "player", update player properties.` : 'If the prompt references specific objects (player, ground, or entities by name/id), target those. Otherwise change global settings.'}
          
          Current Configuration: ${JSON.stringify(gameConfig)}
          
          Guidelines:
          - If "Glassy/Ice": Set material.transmission: 1, material.roughness: 0, and material.thickness: 2.
          - If "Cyberpunk/Neon": Set emissive.intensity: > 5 and vfx.bloom.strength: > 1.5.
          - If "Dreamy/Ethereal": Increase vfx.distortion.strength and set vfx.bloom.radius: 1.
          
          Return ONLY the JSON delta (the changed fields). Do NOT change fields that are not requested.
          If targeting the player, return { "player": { ...updates } }.
          If targeting entities in the list, return { "entities": [ { "id": "ID", ...updates } ] }.
          If global, return { "environment": { ... }, "vfx": { ... }, etc. }.
        `,
        config: {
          responseMimeType: "application/json"
        }
      });

      const delta = JSON.parse(response.text || '{}');
      
      const deepMerge = (target: any, source: any) => {
        Object.keys(source).forEach(key => {
          if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key] || typeof target[key] !== 'object') target[key] = {};
            deepMerge(target[key], source[key]);
          } else if (Array.isArray(source[key]) && key === 'entities') {
            // Special handling for entities array - find by ID and merge
            source[key].forEach((updatedEnt: any) => {
              const existingIdx = target.entities.findIndex((e: any) => e.id === updatedEnt.id);
              if (existingIdx !== -1) {
                deepMerge(target.entities[existingIdx], updatedEnt);
              }
            });
          } else {
            target[key] = source[key];
          }
        });
      };

      setGameConfig(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev)) as GameConfig;
        deepMerge(next, delta);
        setVibeHistory(h => [...h, { prompt: vibe, config: next }]);
        return next;
      });

      addLog("Quantum hot-swap successful.");
    } catch (error) {
       addLog("Vibe injection rejected by core logic.");
       console.error(error);
    } finally {
      setIsVibing(false);
    }
  };

  const handlePublish = async (title: string) => {
    if (!gameConfig) return;
    
    // Check auth
    if (!auth.currentUser) {
      addLog("Auth Required: Please sign in to publish.");
      try {
        await signInWithGoogle();
      } catch (err) {
        addLog("Authentication Interrupted.");
        throw err;
      }
    }
    
    if (!auth.currentUser) return;

    addLog(`Transmitting World Data to Arcade...`);
    try {
      const gameData = {
        title: title,
        description: gameConfig.objective,
        genre: 'Creative' as const,
        thumbnailUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=400',
        creatorId: auth.currentUser.uid,
        creatorName: auth.currentUser.displayName || 'Anonymous Architect',
        likes: 0,
        plays: 0,
        createdAt: Date.now(),
        config: gameConfig
      };

      const { collection, addDoc } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'games'), gameData);
      addLog(`Transmission Received: World live with ID ${docRef.id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'games');
    }
  };

  const handleUndoVibe = () => {
    if (vibeHistory.length <= 1) return;
    const newHistory = [...vibeHistory];
    newHistory.pop(); // Remove current
    const previous = newHistory[newHistory.length - 1];
    setGameConfig(previous.config);
    setVibeHistory(newHistory);
    addLog(`Reverted to: ${previous.prompt}`);
  };

  return (
    <div className="min-h-screen bg-indigo-950 text-white p-6 md:p-12 flex flex-col gap-8">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Sparkles className="w-6 h-6 text-indigo-950" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Nebula Forge</h1>
            <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-mono">v1.1.0 Live Forge</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="p-3 bg-indigo-900/50 hover:bg-indigo-800/50 rounded-full transition-colors border border-indigo-500/30">
            <Save className="w-5 h-5 text-indigo-300" />
          </button>
          <button className="px-6 py-2 bg-cyan-400 text-indigo-950 font-black uppercase text-xs rounded-full tracking-[0.2em] shadow-lg shadow-cyan-400/20 hover:scale-105 transition-transform">
            Publish Game
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Input Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-4 flex flex-col gap-6"
        >
          <div className="bg-indigo-900/40 border border-indigo-500/20 rounded-3xl p-6 flex flex-col gap-4 backdrop-blur-md shadow-2xl shadow-black/20">
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Genesis Prompt</h2>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A low-gravity crystal world with a sphere player..."
              className="w-full h-40 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-indigo-700/50"
            />
            <button 
              onClick={handleForge}
              disabled={isForging || !prompt}
              className="w-full py-4 bg-pink-500 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 shadow-xl shadow-pink-500/30 hover:scale-[1.02] transform transition-all disabled:opacity-50"
            >
              {isForging ? (
                <RotateCcw className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              Forge 3D Engine
            </button>
          </div>

          <div className="bg-indigo-950 border border-indigo-500/20 rounded-2xl p-4 font-mono text-[10px] flex-1 overflow-hidden shadow-xl shadow-black/40">
            <div className="flex items-center gap-2 mb-2 text-indigo-600 uppercase tracking-widest font-bold">
              <Terminal className="w-3 h-3" />
              System Output
            </div>
            <div className="space-y-1">
              {logs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="text-cyan-500/80"
                >
                  {log}
                </motion.div>
              ))}
              {(isForging || isVibing) && <div className="text-pink-500 animate-pulse font-bold tracking-widest uppercase mt-2">Processing Quantum Delta...</div>}
            </div>
          </div>
        </motion.div>

        {/* Preview Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-8 bg-indigo-900/20 border border-indigo-500/20 rounded-3xl overflow-hidden flex flex-col backdrop-blur-sm shadow-2xl shadow-black/20"
        >
          <div className="p-4 border-b border-indigo-500/10 flex justify-between items-center bg-indigo-900/40">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              <span className="text-[10px] font-mono text-indigo-400 tracking-widest uppercase font-bold">Preview::3D_Engine</span>
            </div>
            <button 
              onClick={() => setIsPlaying(true)}
              disabled={!gameConfig}
              className="flex items-center gap-2 px-6 py-2 bg-white text-indigo-950 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              Enter Simulation
            </button>
          </div>
          
          <div className="flex-1 relative flex items-center justify-center bg-indigo-950/40">
            <AnimatePresence mode="wait">
              {gameConfig ? (
                <motion.div 
                  key="game"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="relative group">
                     <div 
                      className="w-40 h-40 rounded-3xl transition-all duration-700 mb-8 shadow-2xl border-2 border-white/20" 
                      style={{ 
                        backgroundColor: gameConfig.player.color, 
                        boxShadow: `0 0 60px ${gameConfig.player.color}40`,
                        borderRadius: gameConfig.player.type === 'sphere' ? '9999px' : '24px'
                      }}
                    />
                    <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400 animate-bounce" />
                  </div>
                  
                  <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-300">Engine Hot-Loaded</h3>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-2xl">
                    <div className="p-4 bg-indigo-900/50 border border-indigo-500/20 rounded-2xl text-left">
                      <div className="text-[9px] text-indigo-400 uppercase font-black mb-1">Physics</div>
                      <div className="text-lg font-black text-white">{gameConfig.physics.gravity} G</div>
                    </div>
                    <div className="p-4 bg-indigo-900/50 border border-indigo-500/20 rounded-2xl text-left">
                      <div className="text-[9px] text-indigo-400 uppercase font-black mb-1">VFX Bloom</div>
                      <div className="text-lg font-black text-cyan-400">{gameConfig.vfx.bloom.strength > 0 ? 'ON' : 'OFF'}</div>
                    </div>
                    <div className="p-4 bg-indigo-900/50 border border-indigo-500/20 rounded-2xl text-left">
                      <div className="text-[9px] text-indigo-400 uppercase font-black mb-1">Ambient</div>
                      <div className="text-lg font-black text-pink-400">{gameConfig.environment.ambientLight}</div>
                    </div>
                    <div className="p-4 bg-indigo-900/50 border border-indigo-500/20 rounded-2xl text-left">
                      <div className="text-[9px] text-indigo-400 uppercase font-black mb-1">Vibe</div>
                      <div className="text-lg font-black text-yellow-400">Stable</div>
                    </div>
                  </div>
                  
                  <p className="mt-8 text-indigo-400 font-mono text-xs font-bold tracking-widest uppercase">Target: {gameConfig.objective}</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="w-24 h-24 bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-2xl shadow-indigo-500/20">
                    <Rocket className="w-10 h-10 text-cyan-400" />
                  </div>
                  <p className="text-indigo-300 font-black uppercase text-xs tracking-[0.3em] animate-pulse">Awaiting Simulation Parameters</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scanning Effect Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {isPlaying && gameConfig && (
          <GameRunner 
            config={gameConfig} 
            onClose={() => setIsPlaying(false)} 
            onVibeShift={handleVibeShift}
            onUndo={handleUndoVibe}
            onPublish={handlePublish}
            isUpdating={isVibing}
            history={vibeHistory}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
