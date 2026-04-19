import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight, LogOut, Mail, ShieldCheck, ExternalLink, Sun, Moon, Loader2, Edit3, Download, BarChart3, TrendingUp, Award, Calendar, Clock, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSettingsFromCache, saveSettingsToCache, getDefaultSettings } from '../services/local-settings.service';
import { getStatsFromCache, saveStatsToCache } from '../services/local-journal-cache';
import ProfileEditor from './ProfileEditor';
import SettingsEditor from './SettingsEditor';
import PasswordEditor from './PasswordEditor';

export default function Profile() {
  const { user, profile, logout, refreshProfile } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(true);
  const [statusMessage, setStatusMessage] = useState('使用本地数据模式');
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [settingsEditorOpen, setSettingsEditorOpen] = useState(false);
  const [passwordEditorOpen, setPasswordEditorOpen] = useState(false);

  React.useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            loadSettings(),
            loadStats()
          ]);
          loadUserProfile();
        } catch (err) {
          console.error('加载数据失败:', err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user]);

  const loadUserProfile = () => {
    if (!user) return;

    try {
      const cachedProfile = localStorage.getItem(`user_profile_${user.id}`);
      if (cachedProfile) {
        const profileData = JSON.parse(cachedProfile);
        console.log('从本地缓存加载用户资料');
        // 可以在这里更新 profile 状态
      }
    } catch (err) {
      console.error('加载用户资料失败:', err);
    }
  };

  const loadSettings = async () => {
    if (!user) return;

    try {
      // 直接使用本地数据，不调用 Supabase
      const cachedSettings = getSettingsFromCache();
      
      if (cachedSettings) {
        setSettings(cachedSettings);
        console.log('从本地缓存加载设置');
      } else {
        // 使用默认设置
        const defaultSettings = getDefaultSettings(user.id);
        setSettings(defaultSettings);
        saveSettingsToCache(defaultSettings);
        console.log('使用默认设置');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      // 即使出错也使用默认设置
      const defaultSettings = getDefaultSettings(user.id);
      setSettings(defaultSettings);
      saveSettingsToCache(defaultSettings);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      // 直接使用本地数据，不调用 Supabase
      const cachedStats = getStatsFromCache();
      
      if (cachedStats) {
        setStats({
          journal: cachedStats,
          meditation: { totalSessions: 0, totalMinutes: 0, avgRating: 0 }
        });
        console.log('从本地缓存加载统计数据');
      } else {
        // 使用默认统计数据
        const defaultStats = {
          total: 0,
          avgRating: 0,
          totalTags: 0
        };
        setStats({
          journal: defaultStats,
          meditation: { totalSessions: 0, totalMinutes: 0, avgRating: 0 }
        });
        saveStatsToCache(defaultStats);
        console.log('使用默认统计数据');
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      // 即使出错也使用默认数据
      const defaultStats = {
        total: 0,
        avgRating: 0,
        totalTags: 0
      };
      setStats({
        journal: defaultStats,
        meditation: { totalSessions: 0, totalMinutes: 0, avgRating: 0 }
      });
      saveStatsToCache(defaultStats);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // 如果 profile 不存在，使用默认值
  const safeProfile = profile || {
    full_name: null,
    avatar_url: null,
    level: 1,
    streak_days: 0,
    total_meditation_minutes: 0
  };

  const handleExportData = async () => {
    if (!user || !stats) return;

    const data = {
      user: {
        id: user.id,
        email: user.email,
        profile: safeProfile,
        settings: settings,
      },
      journal: stats.journal,
      meditation: stats.meditation,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `celestial-sanctuary-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* 本地模式状态提示 */}
      <AnimatePresence>
        {isLocalMode && statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-primary-container/10 border border-primary-container/30 p-4 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm text-primary font-medium">{statusMessage}</span>
            </div>
            <button
              onClick={() => setIsLocalMode(false)}
              className="text-primary/60 hover:text-primary transition-colors"
              title="关闭提示"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profileEditorOpen && (
          <ProfileEditor
            onClose={() => setProfileEditorOpen(false)}
            onSave={() => {
              refreshProfile();
              loadSettings();
            }}
          />
        )}
        {settingsEditorOpen && (
          <SettingsEditor
            onClose={() => setSettingsEditorOpen(false)}
            onSave={() => {
              loadSettings();
            }}
            currentSettings={settings}
          />
        )}
        {passwordEditorOpen && (
          <PasswordEditor
            onClose={() => setPasswordEditorOpen(false)}
            onSave={() => {}}
          />
        )}
      </AnimatePresence>

      <section className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-container-lowest shadow-2xl shadow-primary/10 cursor-pointer group" onClick={() => setProfileEditorOpen(true)}>
            {safeProfile.avatar_url ? (
              <img
                alt="用户头像"
                className="w-full h-full object-cover"
                src={safeProfile.avatar_url}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-4xl text-white font-bold">
                  {safeProfile.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit3 className="text-white w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-1 right-1 bg-tertiary p-2 rounded-full border-2 border-surface shadow-lg">
            <Sparkles className="text-white w-4 h-4 fill-current" />
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-headline font-semibold tracking-wider text-primary">
              {safeProfile.full_name || '星辰守望者'}
            </h2>
            <button
              onClick={() => setProfileEditorOpen(true)}
              className="p-1 hover:bg-surface-container rounded-full transition-colors"
            >
              <Edit3 className="w-4 h-4 text-on-surface-variant" />
            </button>
          </div>
          <p className="text-sm text-on-surface-variant/70 tracking-[0.1em] uppercase mt-1">
            灵魂向导 • {safeProfile.level} 级
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-on-surface-variant">
            <span>连续打卡 {safeProfile.streak_days} 天</span>
            <span>•</span>
            <span>冥想 {safeProfile.total_meditation_minutes} 分钟</span>
          </div>
        </div>
      </section>

      {/* 统计信息卡片 */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-outline">成长统计</h3>
          <button
            onClick={loadStats}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={<Calendar className="text-primary" />}
            label="日记记录"
            value={stats?.journal?.total || 0}
            unit="篇"
            color="from-primary to-primary-container"
          />
          <StatCard
            icon={<Clock className="text-secondary" />}
            label="冥想时长"
            value={safeProfile.total_meditation_minutes}
            unit="分钟"
            color="from-secondary to-secondary-container"
          />
          <StatCard
            icon={<TrendingUp className="text-tertiary" />}
            label="连续打卡"
            value={safeProfile.streak_days}
            unit="天"
            color="from-tertiary to-tertiary-container"
          />
          <StatCard
            icon={<Award className="text-error" />}
            label="当前等级"
            value={safeProfile.level}
            unit="级"
            color="from-error to-error-container"
          />
        </div>
      </section>

      <div className="space-y-10">
        <section>
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-outline mb-6 px-2">音频偏好</h3>
          <div className="bg-surface-container-low rounded-xl p-6 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-base font-medium">默认语速</p>
                <p className="text-xs text-on-surface-variant">为您推荐的自然冥想语速</p>
              </div>
              <button
                onClick={() => setSettingsEditorOpen(true)}
                className="flex items-center gap-4 bg-surface-container-lowest px-4 py-2 rounded-full text-primary font-semibold cursor-pointer hover:bg-primary-container hover:text-on-primary-container transition-colors"
              >
                <span className="text-sm">{settings?.audio_speed || '1.0'}x</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-medium">默认背景音</p>
                <button
                  onClick={() => setSettingsEditorOpen(true)}
                  className="text-sm text-primary font-medium hover:text-primary/80 transition-colors"
                >
                  {settings?.default_ambient_sound || '林间晨雾'} →
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar hide-scrollbar">
                {['林间晨雾', '深海潮汐', '雨落屋檐', '虚无空间'].map((sound, i) => (
                  <button
                    key={sound}
                    className={`flex-none px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      settings?.default_ambient_sound === sound
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container-lowest text-on-surface-variant'
                    }`}
                  >
                    {sound}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-outline mb-6 px-2">外观与主题</h3>
          <button
            onClick={() => setSettingsEditorOpen(true)}
            className="w-full bg-surface-container-low rounded-xl p-6 flex items-center justify-between hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-container rounded-lg">
                {settings?.theme === 'dark' ? (
                  <Moon className="text-primary w-6 h-6" />
                ) : (
                  <Sun className="text-primary w-6 h-6" />
                )}
              </div>
              <div className="text-left">
                <p className="font-medium">主题设置</p>
                <p className="text-xs text-on-surface-variant">
                  {settings?.theme === 'dark' ? '深色模式' : '浅色模式'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-outline" />
          </button>
        </section>

        <section>
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-outline mb-6 px-2">账户设置</h3>
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            <SettingRow icon={<Mail className="text-tertiary" />} label={user.email || '未设置邮箱'} isStatic />
            <div className="h-[1px] mx-6 bg-outline-variant/20"></div>
            <SettingRow
              icon={<ShieldCheck className="text-tertiary" />}
              label="修改密码"
              onClick={() => setPasswordEditorOpen(true)}
            />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-outline mb-6 px-2">数据管理</h3>
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            <SettingRow
              icon={<Download className="text-tertiary" />}
              label="导出个人数据"
              onClick={handleExportData}
            />
            <div className="h-[1px] mx-6 bg-outline-variant/20"></div>
            <SettingRow
              icon={<BarChart3 className="text-tertiary" />}
              label="查看详细统计"
              onClick={() => window.location.href = '/analytics'}
            />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-outline mb-6 px-2">关于应用</h3>
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            <SettingRow icon={<Mail className="text-tertiary" />} label="联系我们的向导" rightIcon={<ExternalLink className="w-4 h-4" />} />
            <div className="h-[1px] mx-6 bg-outline-variant/20"></div>
            <SettingRow icon={<ShieldCheck className="text-tertiary" />} label="隐私协议与精神契约" />
          </div>
          <div className="mt-8 text-center opacity-40">
            <p className="text-[10px] tracking-widest uppercase font-bold">版本 2.4.0 (Aether)</p>
          </div>
        </section>

        <section>
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-error-container/10 text-error rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-error-container/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: number; unit: string; color: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${color} p-4 rounded-xl text-white shadow-lg`}
    >
      <div className="flex items-center gap-2 mb-2">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
        <span className="text-xs font-medium opacity-90">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm opacity-75">{unit}</span>
      </div>
    </motion.div>
  );
}

function SettingRow({ icon, label, extra, rightIcon = <ChevronRight className="w-5 h-5" />, isError, isStatic, onClick }: { icon: React.ReactNode; label: string; extra?: React.ReactNode; rightIcon?: React.ReactNode; isError?: boolean; isStatic?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-5 hover:bg-surface-container-high transition-colors ${isError ? 'text-error' : ''} ${isStatic ? 'cursor-default hover:bg-transparent' : ''}`}
      disabled={isStatic}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      {extra}
      {!isStatic && (
        <div className="text-outline">
          {rightIcon}
        </div>
      )}
    </button>
  );
}