import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileEditorProps {
  onClose: () => void;
  onSave: () => void;
}

export default function ProfileEditor({ onClose, onSave }: ProfileEditorProps) {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 这里可以添加图片上传逻辑
    // 目前使用 URL 作为示例
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // 直接保存到本地缓存，不调用 Supabase
      const userProfile = {
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem(`user_profile_${user.id}`, JSON.stringify(userProfile));
      
      console.log('用户资料已保存到本地缓存');
      onSave();
      onClose();
    } catch (err: any) {
      console.error('本地缓存保存失败:', err);
      setError('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarInitial = () => {
    return fullName?.charAt(0) || user?.email?.charAt(0) || 'U';
  };

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
        className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-on-surface">编辑个人资料</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* 头像编辑 */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface-container cursor-pointer group"
              onClick={handleAvatarClick}
            >
              {avatarUrl ? (
                <img
                  alt="用户头像"
                  className="w-full h-full object-cover"
                  src={avatarUrl}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-3xl text-white font-bold">
                    {getAvatarInitial()}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <p className="text-sm text-on-surface-variant mt-2">点击头像更换</p>
        </div>

        {/* 表单字段 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              姓名
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="输入您的姓名"
              className="w-full px-4 py-3 bg-surface-container rounded-lg border border-outline-variant/30 text-on-surface placeholder:text-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              邮箱
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 bg-surface-container rounded-lg border border-outline-variant/30 text-on-surface-variant/50 cursor-not-allowed"
            />
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