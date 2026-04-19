import React from 'react';
import { motion } from 'motion/react';
import { Menu, Flower2, BookOpen, Edit3, User } from 'lucide-react';
import { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  title?: string;
}

export default function Layout({ children, currentView, onViewChange, title = 'Celestial Sanctuary' }: LayoutProps) {
  return (
    <div className="min-h-screen pb-24">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl flex justify-between items-center px-6 h-16 shadow-sm shadow-primary/5">
        <button className="p-2 hover:bg-primary/5 rounded-full transition-colors">
          <Menu className="w-6 h-6 text-primary" />
        </button>
        <h1 className="text-lg font-bold tracking-widest text-primary uppercase font-headline">
          {title}
        </h1>
        <div className="w-10"></div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-6 max-w-2xl mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-8 pb-6 pt-4 bg-white/60 backdrop-blur-2xl rounded-t-[2rem] z-50 shadow-[0_-10px_40px_rgba(96,80,175,0.08)]">
        <NavItem 
          active={currentView === 'home'} 
          onClick={() => onViewChange('home')} 
          icon={<Flower2 className="w-6 h-6" />} 
          label="圣所" 
        />
        <NavItem 
          active={currentView === 'wisdom'} 
          onClick={() => onViewChange('wisdom')} 
          icon={<BookOpen className="w-6 h-6" />} 
          label="智慧" 
        />
        <NavItem 
          active={currentView === 'journal'} 
          onClick={() => onViewChange('journal')} 
          icon={<Edit3 className="w-6 h-6" />} 
          label="日记" 
        />
        <NavItem 
          active={currentView === 'profile'} 
          onClick={() => onViewChange('profile')} 
          icon={<User className="w-6 h-6" />} 
          label="个人" 
        />
      </nav>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 transition-all duration-300 ${
        active 
          ? 'bg-gradient-to-br from-primary/20 to-secondary/20 text-primary rounded-full scale-110' 
          : 'text-outline hover:text-primary'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold tracking-wider mt-1 uppercase">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute inset-0 rounded-full bg-primary/5 -z-10"
        />
      )}
    </button>
  );
}
