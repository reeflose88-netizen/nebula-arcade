import React from 'react';
import { motion } from 'motion/react';
import { Play, Heart, Users } from 'lucide-react';
import { GameMetadata } from '../types';

interface GameCardProps {
  game: GameMetadata;
  onPlay: (id: string) => void;
}

export default function GameCard({ game, onPlay }: GameCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative bg-indigo-800/40 border border-indigo-500/20 rounded-3xl overflow-hidden cursor-pointer backdrop-blur-sm"
      onClick={() => onPlay(game.id)}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] overflow-hidden relative">
        <img 
          src={game.thumbnailUrl} 
          alt={game.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 via-indigo-900/20 to-transparent opacity-80" />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <Play className="w-6 h-6 text-indigo-950 fill-current" />
          </div>
        </div>

        {/* Genre Tag */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-yellow-400 text-indigo-950 rounded-full text-[10px] font-black uppercase tracking-widest">
            {game.genre}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-black tracking-tighter group-hover:text-cyan-400 transition-colors uppercase">
            {game.title}
          </h3>
          <div className="flex items-center gap-1 text-pink-500 font-black text-[10px] bg-indigo-900/50 px-2 py-1 rounded-md">
            <Heart className="w-3 h-3 fill-current" />
            {game.likes}
          </div>
        </div>
        
        <p className="text-indigo-300 text-xs mb-6 line-clamp-2 leading-relaxed h-8 uppercase tracking-tight">
          {game.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-indigo-500/20">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-yellow-500 border border-indigo-500/30" />
             <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-black">{game.creatorName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] uppercase tracking-widest font-black">
            <Users className="w-3 h-3" />
            {game.plays}
          </div>
        </div>
        
        <button className="w-full mt-6 py-3 bg-indigo-700/50 hover:bg-white hover:text-indigo-950 transition-all border border-indigo-500/30 rounded-xl font-bold text-xs uppercase tracking-widest">
            Play Now
        </button>
      </div>
    </motion.div>
  );
}
