import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import AuthPage from './components/AuthPage';
import Home from './components/Home';
import KnowledgeBase from './components/KnowledgeBase';
import Journal from './components/Journal';
import Profile from './components/Profile';
import SessionDetail from './components/SessionDetail';
import { View } from './types';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');
  const [showAISession, setShowAISession] = useState(false);

  const handleAISessionStart = () => {
    setShowAISession(true);
  };

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-on-surface-variant">正在连接...</p>
        </div>
      </div>
    );
  }

  // 显示认证页面
  if (!user) {
    return <AuthPage />;
  }

  // 显示主应用
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onAISessionStart={handleAISessionStart} />;
      case 'wisdom':
        return <KnowledgeBase />;
      case 'journal':
        return <Journal />;
      case 'profile':
        return <Profile />;
      default:
        return <Home onAISessionStart={handleAISessionStart} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface font-sans">
      <Layout
        currentView={currentView}
        onViewChange={setCurrentView}
        title={
          currentView === 'home'
            ? 'Celestial Sanctuary'
            : currentView === 'wisdom'
            ? '疗愈知识库'
            : currentView === 'journal'
            ? '疗愈日记'
            : '个人中心'
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </Layout>

      {/* AI Session Overlay */}
      <AnimatePresence>
        {showAISession && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100]"
          >
            <SessionDetail 
              session={{
                id: 'ai-session',
                title: 'AI 智能引导',
                subtitle: '个性化冥想疗愈',
                description: '让 AI 导师根据你的需求提供个性化的冥想引导，陪伴你进行深层的疗愈之旅。',
                image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1000&auto=format&fit=crop',
                category: 'AI 引导',
                icon: 'psychology',
                color: '#6050af',
                bgColor: '#e6deff',
              }}
              onBack={() => setShowAISession(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}