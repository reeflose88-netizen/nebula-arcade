import React from 'react';
import { Gamepad2, Sparkles, Users, Search, Bell, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, auth } from '../lib/firebase';

interface NavbarProps {
  activePage: 'home' | 'creator';
  onPageChange: (page: 'home' | 'creator') => void;
}

export default function Navbar({ activePage, onPageChange }: NavbarProps) {
  const { user } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => auth.signOut();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-indigo-500/30 bg-indigo-900/50 backdrop-blur-xl px-8 h-16">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onPageChange('home')}
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-yellow-400 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-pink-500/20">
            <Gamepad2 className="w-6 h-6 text-indigo-950" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">
            Nebula <span className="text-cyan-400">Arcade</span>
          </span>
        </div>

        {/* Center Nav */}
        <div className="flex bg-indigo-800/30 p-1 rounded-full border border-indigo-500/20">
          <button 
            onClick={() => onPageChange('home')}
            className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activePage === 'home' ? 'bg-white text-indigo-950' : 'text-indigo-200 hover:text-white'}`}
          >
            <Gamepad2 className="w-3 h-3" />
            Explore
          </button>
          <button 
            onClick={() => onPageChange('creator')}
            className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activePage === 'creator' ? 'bg-white text-indigo-950' : 'text-indigo-200 hover:text-white'}`}
          >
            <Sparkles className="w-3 h-3" />
            Creators
          </button>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <button className="p-2 text-indigo-300 hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
          
          {user ? (
            <div className="flex items-center gap-4">
              <button className="p-2 text-indigo-300 hover:text-white transition-colors relative">
                <Bell className="w-5 h-5" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border-2 border-indigo-900" />
              </button>
              <div className="group relative">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border border-indigo-500/30 cursor-pointer"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute right-0 top-10 w-48 bg-indigo-900 border border-indigo-500/30 rounded-xl py-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity shadow-2xl">
                   <div className="px-4 py-2 border-b border-indigo-500/10 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                      <p className="text-[10px] text-indigo-300 truncate">{user.email}</p>
                   </div>
                   <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest text-pink-400 hover:bg-white/5 transition-colors font-black"
                   >
                     <LogOut className="w-3 h-3" />
                     Sign Out
                   </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="px-6 py-2 bg-cyan-400 text-indigo-950 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-cyan-400/20 hover:scale-105 transition-transform"
            >
              Build a Game
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
