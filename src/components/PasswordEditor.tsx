import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2, Eye, EyeOff, Lock } from 'lucide-react';
import { updatePassword as updatePasswordService } from '../services/auth.service';

interface PasswordEditorProps {
  onClose: () => void;
  onSave: () => void;
}

export default function PasswordEditor({ onClose, onSave }: PasswordEditorProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    // 验证输入
    if (!currentPassword) {
      setError('请输入当前密码');
      return;
    }

    if (newPassword.length < 6) {
      setError('新密码长度至少为6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    if (currentPassword === newPassword) {
      setError('新密码不能与当前密码相同');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 先验证当前密码（这里需要先重新登录验证）
      const { supabase } = await import('../lib/supabase');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        setError('当前密码错误');
        setLoading(false);
        return;
      }

      // 更新密码
      const { error: updateError } = await updatePasswordService(newPassword);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSave();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, color: 'bg-outline-variant', text: '' };
    if (password.length < 6) return { strength: 25, color: 'bg-error', text: '弱' };
    if (password.length < 8) return { strength: 50, color: 'bg-warning', text: '中' };
    if (password.length < 12) return { strength: 75, color: 'bg-tertiary', text: '强' };
    return { strength: 100, color: 'bg-primary', text: '很强' };
  };

  const strength = getPasswordStrength(newPassword);

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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-container rounded-lg">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-on-surface">修改密码</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-lg font-semibold text-on-surface mb-2">密码修改成功</h4>
            <p className="text-sm text-on-surface-variant">请使用新密码重新登录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 当前密码 */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                当前密码
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="输入当前密码"
                  className="w-full px-4 py-3 bg-surface-container rounded-lg border border-outline-variant/30 text-on-surface placeholder:text-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 新密码 */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                新密码
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="输入新密码（至少6位）"
                  className="w-full px-4 py-3 bg-surface-container rounded-lg border border-outline-variant/30 text-on-surface placeholder:text-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2">
                  <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${strength.strength}%` }}
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">密码强度: {strength.text}</p>
                </div>
              )}
            </div>

            {/* 确认新密码 */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                确认新密码
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className="w-full px-4 py-3 bg-surface-container rounded-lg border border-outline-variant/30 text-on-surface placeholder:text-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-error mt-1">两次输入的密码不一致</p>
              )}
            </div>
          </div>
        )}

        {error && !success && (
          <div className="mt-4 p-3 bg-error-container/10 text-error rounded-lg text-sm">
            {error}
          </div>
        )}

        {!success && (
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
                  修改中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  修改密码
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}