import React, { Suspense, useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Stars, 
  Float, 
  Text, 
  Environment,
  ContactShadows,
  Html,
  Select
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'motion/react';
import { X, Command, Sparkles, RotateCcw, History, Undo2, ChevronRight, Zap, Activity, Globe } from 'lucide-react';
import { GameConfig, GameEntity } from '../types';
import * as THREE from 'three';

// Color safety helper to remove alpha channel from hex strings (Three.js Color doesn't like #rrggbbaa)
const safeColor = (c: any) => {
  if (!c || typeof c !== 'string') return '#ffffff';
  const hex = c.trim();
  if (hex.startsWith('#')) {
    // Trim to 7 chars if it's #rrggbbaa
    return hex.length > 7 ? hex.substring(0, 7) : hex;
  }
  // If it's a color name or rgb, just return it, but ensure it's not empty
  return hex || '#ffffff';
};

interface GameRunnerProps {
  config: GameConfig;
  onClose: () => void;
  onVibeShift?: (prompt: string, targetIds?: string[]) => Promise<void>;
  onUndo?: () => void;
  onPublish?: (title: string) => Promise<void>;
  isUpdating?: boolean;
  history?: { prompt: string; config: GameConfig }[];
}

function EntityHUD({ entity, isPlayer, isGroup }: { entity: GameEntity, isPlayer?: boolean, isGroup?: boolean }) {
  return (
    <Html
      distanceFactor={10}
      position={[0, entity.scale + 0.5, 0]}
      center
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="pointer-events-none select-none min-w-[140px]"
      >
        <div className="bg-indigo-950/95 backdrop-blur-md border border-cyan-400/50 p-3 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.2)] flex flex-col gap-2">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Zap size={12} className="text-pink-500" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.1em]">
              {isGroup ? 'Group Selection' : (entity.name || entity.id)}
            </span>
            {isPlayer && <div className="ml-auto px-1.5 py-0.5 bg-cyan-500 text-indigo-950 text-[7px] font-black rounded tracking-widest">PLAYER</div>}
          </div>

          {!isGroup && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-indigo-400 uppercase tracking-tighter">Scale</span>
                <span className="text-cyan-400 font-bold">{entity.scale?.toFixed(2) ?? '1.00'}</span>
              </div>
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-indigo-400 uppercase tracking-tighter">Roughness</span>
                <span className="text-pink-400 font-bold">{entity.material?.roughness?.toFixed(2) ?? '0.50'}</span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-2">
            <Activity size={10} className="text-cyan-400 animate-pulse" />
            <span className="text-[8px] text-indigo-500 uppercase font-black tracking-widest">Vibe Injector Online</span>
          </div>
        </div>
        <div className="w-px h-8 bg-gradient-to-b from-cyan-400/50 to-transparent mx-auto" />
      </motion.div>
    </Html>
  );
}

function VibeManagedMesh({ 
  entity, 
  isSelected, 
  onSelect,
  isPlayer,
  distortion
}: { 
  entity: GameEntity, 
  isSelected: boolean, 
  onSelect: (id: string | null, isMulti?: boolean) => void,
  isPlayer?: boolean,
  distortion?: { speed: number; strength: number }
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const startTime = useRef(performance.now());
  
  useFrame(() => {
    if (!meshRef.current || !entity) return;
    const t = (performance.now() - startTime.current) / 1000;
    
    if (isPlayer && entity.position) {
      meshRef.current.position.y = entity.position[1] + Math.sin(t * 2) * 0.2 + 0.5;
    }
    
    meshRef.current.rotation.y += 0.01;
    
    if (distortion && distortion.strength > 0) {
      meshRef.current.scale.setScalar(
        entity.scale * (1 + Math.sin(t * distortion.speed) * distortion.strength * 0.1)
      );
    }
  });

  return (
    <group position={entity.position}>
      {isSelected && <EntityHUD entity={entity} isPlayer={isPlayer} />}
      <mesh 
        ref={meshRef} 
        castShadow 
        receiveShadow
        name={entity.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(entity.id, e.shiftKey || e.metaKey || e.ctrlKey);
        }}
      >
        {entity.type === 'box' && <boxGeometry args={[entity.scale, entity.scale, entity.scale]} />}
        {entity.type === 'sphere' && <sphereGeometry args={[entity.scale / 2, 64, 64]} />}
        {entity.type === 'capsule' && <capsuleGeometry args={[entity.scale / 3, entity.scale, 4, 32]} />}
        
        <meshPhysicalMaterial 
          color={safeColor(entity.color)} 
          emissive={isSelected ? '#00ffff' : safeColor(entity.emissive?.color || '#000000')}
          emissiveIntensity={isSelected ? (2 + Math.sin(Date.now() / 200) * 0.5) : (entity.emissive?.intensity || 0)}
          metalness={entity.material?.metalness ?? 0} 
          roughness={entity.material?.roughness ?? 1} 
          transmission={entity.material?.transmission ?? 0}
          thickness={entity.material?.thickness ?? 0}
          attenuationColor={safeColor(entity.color)}
          attenuationDistance={1}
        />
      </mesh>
    </group>
  );
}

export default function GameRunner({ config, onClose, onVibeShift, onUndo, onPublish, isUpdating, history = [] }: GameRunnerProps) {
  const [vibePrompt, setVibePrompt] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (showHistory) setShowHistory(false);
        else if (selectedIds.length > 0) setSelectedIds([]);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHistory, onClose, selectedIds]);

  const handleSelect = (id: string | null, isMulti?: boolean) => {
    if (!id) {
      setSelectedIds([]);
      return;
    }
    if (isMulti) {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSelectedIds([id]);
    }
  };

  const handleVibeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vibePrompt && onVibeShift) {
      onVibeShift(vibePrompt, selectedIds.length > 0 ? selectedIds : undefined);
      setVibePrompt('');
      inputRef.current?.blur();
    }
  };

  const handlePublishClick = async () => {
    if (!onPublish) return;
    setIsPublishing(true);
    try {
      await onPublish(config.objective || "Vibe-Coded World");
      setShowPublishSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <motion.div 
      id="game-runner-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-indigo-950 flex flex-col items-center justify-center p-0 md:p-8 overflow-hidden"
    >
      <div className="relative w-full h-full bg-black md:rounded-3xl border-0 md:border border-indigo-500/30 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
        
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-cyan-400 animate-pulse font-mono uppercase tracking-[0.3em] bg-indigo-950">Initializing Simulation...</div>}>
          <Canvas 
            shadows
            gl={{ antialias: true, alpha: true, stencil: false }}
            dpr={[1, 2]}
            onPointerMissed={() => setSelectedIds([])}
          >
            <PerspectiveCamera makeDefault position={[5, 4, 8]} fov={45} />
            <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} enableDamping />
            
            <color attach="background" args={[safeColor(config.environment?.skyColor || '#000000')]} />
            <fog attach="fog" args={[safeColor(config.environment?.skyColor || '#000000'), 5, 25 - (config.environment?.fogDensity ?? 0) * 10]} />

            <ambientLight intensity={config.environment?.ambientLight ?? 0.5} />
            <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
            <Stars radius={100} depth={50} count={5000 * (config.environment?.particleDensity ?? 1)} factor={4} saturation={0} fade speed={1} />

            <Select
              box
              multiple
              onChange={(items) => {
                const ids = items.map(item => item.name);
                setSelectedIds(ids);
              }}
            >
              {/* Render Player */}
              <VibeManagedMesh 
                entity={config.player} 
                isSelected={selectedIds.includes(config.player.id)} 
                onSelect={handleSelect}
                isPlayer
                distortion={config.vfx.distortion}
              />

              {/* Render Other Entities */}
              {config.entities.map(entity => (
                <VibeManagedMesh 
                  key={entity.id}
                  entity={entity}
                  isSelected={selectedIds.includes(entity.id)}
                  onSelect={handleSelect}
                  distortion={config.vfx.distortion}
                />
              ))}
            </Select>

            {/* Arena */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
              <planeGeometry args={[40, 40]} />
              <meshStandardMaterial color={safeColor(config.environment?.groundColor || '#333333')} roughness={0.9} metalness={0.1} />
            </mesh>

            <gridHelper args={[40, 20, 0x333333, 0x111111]} position={[0, -0.49, 0]} />
            
            <ContactShadows position={[0, -0.5, 0]} opacity={0.6} scale={15} blur={1} far={5} />
            
            <Suspense fallback={null}>
              <Environment preset="night" />
            </Suspense>

            <Text
              position={[0, 5, -10]}
              fontSize={0.8}
              color="white"
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
              anchorX="center"
              anchorY="middle"
            >
              {config.objective}
            </Text>

            <EffectComposer multisampling={0}>
              {config.vfx?.bloom && (
                <Bloom 
                  intensity={config.vfx.bloom.strength ?? 1} 
                  threshold={config.vfx.bloom.threshold ?? 0.9} 
                  radius={config.vfx.bloom.radius ?? 0.4} 
                />
              )}
              {config.vfx?.chromaticAberration !== undefined && (
                <ChromaticAberration offset={new THREE.Vector2(config.vfx.chromaticAberration * 0.005, config.vfx.chromaticAberration * 0.005)} />
              )}
            </EffectComposer>
          </Canvas>
        </Suspense>

        {/* UI Overlays */}
        <div className="absolute top-8 left-8 flex flex-col gap-3 pointer-events-none">
          <div className="bg-indigo-900/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 pointer-events-auto">
             <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Neural Engine 2.0</span>
          </div>
          
          <AnimatePresence>
            {isUpdating && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-cyan-500 text-indigo-950 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <RotateCcw className="w-3 h-3 animate-spin" />
                Synthesizing Vibe...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute top-8 right-8 flex gap-3">
          <button 
            onClick={handlePublishClick}
            disabled={isPublishing}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Globe className="w-4 h-4" />
            {isPublishing ? 'Transmitting...' : 'Publish World'}
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-3 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <History className="w-5 h-5" />
          </button>
          <button 
            onClick={onClose}
            className="p-3 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white text-white hover:text-black rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vibe History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute top-0 right-0 h-full w-80 bg-indigo-950/90 backdrop-blur-2xl border-l border-white/10 z-[210] p-8 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-black uppercase tracking-widest">History</h3>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {history.map((item, i) => (
                  <div key={i} className="group relative">
                    {i === history.length - 1 && (
                      <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
                    )}
                    <div className={`p-4 rounded-xl border transition-all ${i === history.length - 1 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 opacity-60'}`}>
                      <div className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest mb-1">0{i + 1} // PROMPT</div>
                      <div className="text-xs font-medium text-white line-clamp-2">"{item.prompt}"</div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={onUndo}
                disabled={history.length <= 1}
                className="mt-8 w-full py-4 bg-indigo-900/50 border border-indigo-500/30 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Undo2 className="w-4 h-4" />
                Undo Vibe Shift
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vibe Coding Command Palette */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xl px-6">
          <form 
            onSubmit={handleVibeSubmit}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-2xl blur opacity-20 group-focus-within:opacity-60 transition-opacity" />
            <div className="relative flex items-center bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-6 py-5 shadow-2xl">
              <Command className="w-5 h-5 text-indigo-400 mr-4" />
              <input 
                ref={inputRef}
                type="text"
                value={vibePrompt}
                onChange={(e) => setVibePrompt(e.target.value)}
                placeholder={selectedIds.length > 0 ? `Targeting ${selectedIds.length} objects...` : "⌘K to shift the vibe... (e.g., 'Heavy liquid gold', 'Cyberpunk neon')"}
                className="bg-transparent border-none outline-none flex-1 text-sm font-medium text-white placeholder:text-indigo-800/50"
              />
              {selectedIds.length > 0 && (
                <div className="mr-4 px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-[8px] font-black text-cyan-400 tracking-widest uppercase animate-pulse">
                  Targeted ({selectedIds.length})
                </div>
              )}
              {isUpdating ? (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Logic Hub</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-[9px] uppercase font-black tracking-widest text-indigo-600">
                  <div className="px-2 py-1 bg-white/5 rounded border border-white/5">ENTER</div>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Publish Success Modal */}
        <AnimatePresence>
          {showPublishSuccess && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[300] bg-indigo-950/90 backdrop-blur-2xl flex items-center justify-center p-8"
            >
              <div className="max-w-md w-full bg-indigo-900 border-2 border-cyan-400 p-8 rounded-3xl shadow-[0_0_50px_rgba(34,211,238,0.3)] text-center">
                <div className="w-20 h-20 bg-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <Globe className="w-10 h-10 text-indigo-950" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Transmission Received</h2>
                <p className="text-cyan-400 font-mono text-xs mb-8 italic">Your 3D world is now live in the Nebula Arcade.</p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="w-full py-4 bg-pink-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-pink-500 transition-all hover:scale-[1.02]"
                  >
                    View in Arcade
                  </button>
                  <button 
                    onClick={() => setShowPublishSuccess(false)}
                    className="w-full py-4 border border-indigo-400 text-indigo-300 font-black uppercase tracking-widest rounded-xl hover:text-white transition-all"
                  >
                    Continue Forging
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instruction overlay */}
        <div className="absolute bottom-4 left-6 text-[8px] text-white/20 uppercase tracking-[0.3em] font-black pointer-events-none hidden md:block">
          Orbit: Click + Drag • Multiselect: Drag Box / Shift+Click • Vibe: ⌘+K
        </div>
      </div>
    </motion.div>
  );
}
