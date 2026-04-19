import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
}

export default function LoginForm({ onToggleMode }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('请输入邮箱');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('请输入有效的邮箱地址');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('请输入密码');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('密码至少需要 6 个字符');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) validateEmail(value);
    else setEmailError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value) validatePassword(value);
    else setPasswordError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-on-surface">欢迎回来</h2>
        <p className="text-sm text-on-surface-variant">登录你的 Celestial Sanctuary 账户</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-3 p-4 bg-error-container/10 border border-error-container/30 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-error shrink-0" />
            <span className="text-sm text-error">{error}</span>
          </motion.div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface">邮箱</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant" />
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="your@email.com"
                className={`w-full pl-12 pr-4 py-3 bg-surface-container-lowest border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  emailError
                    ? 'border-error focus:border-error focus:ring-error/20'
                    : 'border-outline-variant/30 focus:border-primary focus:ring-primary/20'
                }`}
                required
              />
            </div>
            {emailError && (
              <p className="text-xs text-error">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface">密码</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant" />
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className={`w-full pl-12 pr-4 py-3 bg-surface-container-lowest border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  passwordError
                    ? 'border-error focus:border-error focus:ring-error/20'
                    : 'border-outline-variant/30 focus:border-primary focus:ring-primary/20'
                }`}
                required
                minLength={6}
              />
            </div>
            {passwordError && (
              <p className="text-xs text-error">{passwordError}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" />
            <span className="text-on-surface-variant">记住我</span>
          </label>
          <button type="button" className="text-primary hover:underline">
            忘记密码？
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              <span>登录中...</span>
            </>
          ) : (
            <>
              <span>登录</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Toggle */}
      <div className="text-center">
        <p className="text-sm text-on-surface-variant">
          还没有账户？{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary font-semibold hover:underline"
          >
            立即注册
          </button>
        </p>
      </div>
    </motion.div>
  );
}