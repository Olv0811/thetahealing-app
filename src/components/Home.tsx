import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mic, Play, Volume2, Headphones, Calendar, Flame } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HomeProps {
  onAISessionStart: () => void;
}

export default function Home({ onAISessionStart }: HomeProps) {
  const { user, profile } = useAuth();
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTodayStats();
    }
  }, [user]);

  const loadTodayStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { getMeditationStats } = await import('../services/meditation.service');
      const { getRecentMeditationSessions } = await import('../services/meditation.service');

      const [statsData, recentData] = await Promise.all([
        getMeditationStats(user.id),
        getRecentMeditationSessions(user.id, 1),
      ]);

      if (!recentData.error) {
        const today = new Date().toDateString();
        const todaySessions = recentData.sessions.filter(
          (s) => new Date(s.created_at).toDateString() === today && s.completed
        );
        setTodayMinutes(todaySessions.reduce((sum, s) => sum + s.duration, 0));
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早安';
    if (hour < 18) return '午安';
    return '晚安';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary-container rounded-full mb-6 shadow-xl shadow-primary/30"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-on-surface font-headline tracking-wide">
          {getGreeting()}，{profile?.full_name || '星辰守望者'}
        </h1>
        <p className="text-on-surface-variant font-light leading-relaxed px-4">
          愿今日的希塔波带给你深层的宁静与指引。
        </p>
      </section>

      {/* AI引导主入口 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-primary via-primary-container to-secondary-container shadow-2xl shadow-primary/20"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white font-headline tracking-wide">
              AI 智能引导
            </h2>
          </div>
          
          <p className="text-white/90 text-center mb-8 leading-relaxed">
            让 AI 导师陪伴你的冥想之旅，根据你的需求提供个性化的疗愈引导。
          </p>
          
          <button
            onClick={onAISessionStart}
            className="w-full py-5 bg-white text-primary rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 active:scale-95"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>开始 AI 引导</span>
          </button>
          
          <div className="flex justify-center gap-6 mt-6 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4" />
              <span>建议佩戴耳机</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span>背景音乐可选</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 今日进度 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface-container-low rounded-2xl p-6 space-y-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-on-surface mb-1">今日冥想</h3>
            <p className="text-on-surface-variant text-xs tracking-wider uppercase">Daily Progress</p>
          </div>
          <div className="text-right">
            {loading ? (
              <span className="text-2xl font-extrabold text-primary">--</span>
            ) : (
              <>
                <span className="text-2xl font-extrabold text-primary">{todayMinutes}</span>
                <span className="text-on-surface-variant text-sm"> 分钟</span>
              </>
            )}
          </div>
        </div>
        
        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: loading ? 0 : `${Math.min((todayMinutes / 30) * 100, 100)}%` }}
            className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="text-primary w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">连续打卡</p>
              <p className="text-lg font-bold text-on-surface">{profile?.streak_days || 0} 天</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Flame className="text-secondary w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">觉察等级</p>
              <p className="text-lg font-bold text-on-surface">Theta {profile?.level || 1}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 每日灵感 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative overflow-hidden rounded-2xl aspect-[16/9] flex items-center justify-center text-center p-8"
      >
        <img
          alt="Zen Background"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        <div className="relative z-10">
          <Sparkles className="text-tertiary-fixed w-8 h-8 mx-auto mb-4" />
          <blockquote className="text-xl md:text-2xl font-light text-white leading-relaxed mb-4 font-headline">
            "愈合不是终点，而是行于世间的一种方式。"
          </blockquote>
          <cite className="text-white/80 text-sm font-medium tracking-widest not-italic">每日灵感 · 希塔智慧</cite>
        </div>
      </motion.section>
    </div>
  );
}