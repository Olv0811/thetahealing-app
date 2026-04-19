import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flower2 } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-surface to-secondary/5 flex items-center justify-center p-6">
      {/* Background Decorations */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 space-y-8"
      >
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg">
            <Flower2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-wider text-on-surface">Celestial Sanctuary</h1>
          <p className="text-sm text-on-surface-variant mt-1">希塔疗愈 · 灵性之旅</p>
        </div>

        {/* Form Container */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <LoginForm onToggleMode={() => setMode('register')} />
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <RegisterForm onToggleMode={() => setMode('login')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-outline-variant/10">
          <p className="text-xs text-on-surface-variant/60">
            继续即表示您同意我们的{' '}
            <a href="#" className="text-primary hover:underline">服务条款</a>
            {' '}和{' '}
            <a href="#" className="text-primary hover:underline">隐私政策</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}