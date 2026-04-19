import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Sparkles, ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterFormProps {
  onToggleMode: () => void;
}

export default function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

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

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError('请确认密码');
      return false;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError('两次输入的密码不一致');
      return false;
    }
    setConfirmPasswordError('');
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
    // 如果确认密码已输入，重新验证确认密码
    if (confirmPassword) {
      validateConfirmPassword(confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (value) validateConfirmPassword(value);
    else setConfirmPasswordError('');
  };

  const validateForm = () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    return isEmailValid && isPasswordValid && isConfirmPasswordValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      await register(email, password, fullName);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 py-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-container rounded-full">
          <Check className="w-10 h-10 text-on-secondary-container" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-on-surface mb-2">注册成功！</h2>
          <p className="text-sm text-on-surface-variant">
            我们已发送确认邮件到 {email}，请查收并激活您的账户。
          </p>
        </div>
        <button
          onClick={onToggleMode}
          className="px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary-fixed transition-colors"
        >
          返回登录
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="text-2xl font-bold text-on-surface">创建账户</h2>
        <p className="text-sm text-on-surface-variant">开始你的 Celestial Sanctuary 之旅</p>
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
            <label className="text-sm font-medium text-on-surface">昵称（可选）</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="星辰守望者"
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
              />
            </div>
          </div>

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
                    : 'border-outline-variant/30 focus:border-secondary focus:ring-secondary/20'
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
                    : 'border-outline-variant/30 focus:border-secondary focus:ring-secondary/20'
                }`}
                required
                minLength={6}
              />
            </div>
            {passwordError && (
              <p className="text-xs text-error">{passwordError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface">确认密码</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant" />
              <input
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="••••••••"
                className={`w-full pl-12 pr-4 py-3 bg-surface-container-lowest border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  confirmPasswordError
                    ? 'border-error focus:border-error focus:ring-error/20'
                    : 'border-outline-variant/30 focus:border-secondary focus:ring-secondary/20'
                }`}
                required
                minLength={6}
              />
            </div>
            {confirmPasswordError && (
              <p className="text-xs text-error">{confirmPasswordError}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-secondary to-secondary-container text-on-secondary rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-secondary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-on-secondary/30 border-t-on-secondary rounded-full animate-spin" />
              <span>注册中...</span>
            </>
          ) : (
            <>
              <span>创建账户</span>
              <Sparkles className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Toggle */}
      <div className="text-center">
        <p className="text-sm text-on-surface-variant">
          已有账户？{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-secondary font-semibold hover:underline flex items-center justify-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            返回登录
          </button>
        </p>
      </div>
    </motion.div>
  );
}