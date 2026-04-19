import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2, Bell, Volume2, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveSettingsToCache } from '../services/local-settings.service';

interface SettingsEditorProps {
  onClose: () => void;
  onSave: () => void;
  currentSettings: any;
}

export default function SettingsEditor({ onClose, onSave, currentSettings }: SettingsEditorProps) {
  const { user } = useAuth();
  const [theme, setTheme] = useState(currentSettings?.theme || 'light');
  const [audioSpeed, setAudioSpeed] = useState(currentSettings?.audio_speed || 1.0);
  const [defaultAmbientSound, setDefaultAmbientSound] = useState(currentSettings?.default_ambient_sound || 'forest');
  const [notificationEnabled, setNotificationEnabled] = useState(currentSettings?.notification_enabled ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // 直接保存到本地缓存，不调用 Supabase
      const localSettings = {
        user_id: user.id,
        theme,
        language: 'zh-CN',
        audio_speed: audioSpeed,
        default_ambient_sound: defaultAmbientSound,
        notification_enabled: notificationEnabled,
        meditation_reminder_time: null,
      };
      
      saveSettingsToCache(localSettings);
      applyTheme(theme);
      
      console.log('设置已保存到本地缓存');
      onSave();
      onClose();
    } catch (err: any) {
      console.error('本地缓存保存失败:', err);
      setError('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (newTheme: string) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const audioSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const ambientSounds = [
    { id: 'forest', name: '林间晨雾' },
    { id: 'ocean', name: '深海潮汐' },
    { id: 'rain', name: '雨落屋檐' },
    { id: 'void', name: '虚无空间' },
    { id: 'wind', name: '微风轻拂' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-on-surface">设置</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <div className="space-y-6">
          {/* 主题设置 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sun className="w-5 h-5 text-tertiary" />
              <h4 className="font-semibold text-on-surface">主题</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === 'light'
                    ? 'border-primary bg-primary-container/20'
                    : 'border-outline-variant/30 bg-surface-container'
                }`}
              >
                <Sun className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium">浅色</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-primary bg-primary-container/20'
                    : 'border-outline-variant/30 bg-surface-container'
                }`}
              >
                <Moon className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium">深色</span>
              </button>
            </div>
          </div>

          {/* 音频设置 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-5 h-5 text-tertiary" />
              <h4 className="font-semibold text-on-surface">音频速度</h4>
            </div>
            <div className="flex gap-2 flex-wrap">
              {audioSpeeds.map((speed) => (
                <button
                  key={speed}
                  onClick={() => setAudioSpeed(speed)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    audioSpeed === speed
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* 背景音设置 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-5 h-5 text-tertiary" />
              <h4 className="font-semibold text-on-surface">默认背景音</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ambientSounds.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => setDefaultAmbientSound(sound.id)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                    defaultAmbientSound === sound.id
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {sound.name}
                </button>
              ))}
            </div>
          </div>

          {/* 通知设置 */}
          <div>
            <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-tertiary" />
                <div>
                  <h4 className="font-semibold text-on-surface">通知提醒</h4>
                  <p className="text-xs text-on-surface-variant">接收冥想提醒和更新通知</p>
                </div>
              </div>
              <button
                onClick={() => setNotificationEnabled(!notificationEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  notificationEnabled ? 'bg-primary' : 'bg-surface-container-high'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notificationEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-error-container/10 text-error rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 按钮组 */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-surface-container text-on-surface rounded-lg font-medium hover:bg-surface-container-high transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}