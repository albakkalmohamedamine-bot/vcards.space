'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, signInWithEmail } from '@/lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, Eye, EyeOff, Check, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    // If already logged in, redirect straight to homepage
    getSession().then((session) => {
      if (session) {
        router.replace('/');
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signInWithEmail(email, password);

    if (result.success) {
      setIsSuccess(true);
      // Give a brief moment for success feedback then navigate to homepage
      setTimeout(() => {
        router.push('/');
      }, 600);
    } else {
      setIsLoading(false);
      setError('Invalid credentials');
      setShakeKey((prev) => prev + 1);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 90,
        damping: 16,
        staggerChildren: 0.09,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 110,
        damping: 14,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#F2EBDD] text-slate-900 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-amber-200">
      {/* Background Decorative Blur Spheres */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-900/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-900/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full max-w-md mx-auto flex items-center justify-end pt-2">
        <span className="text-[10px] font-mono tracking-widest text-amber-900/60 uppercase font-bold bg-amber-900/5 px-3 py-1 rounded-full border border-amber-900/10">
          Admin Protection
        </span>
      </div>

      {/* Main Login Card */}
      <div className="my-auto py-8">
        <motion.div
          key={shakeKey}
          initial={{ x: 0 }}
          animate={shakeKey > 0 ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="w-full max-w-md mx-auto"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white/90 backdrop-blur-md rounded-[32px] sm:rounded-[38px] shadow-[0_20px_60px_rgba(27,42,74,0.08)] border border-amber-900/10 p-6 sm:p-9 relative overflow-hidden"
          >
            {/* Loading & Success Animation Overlay */}
            <AnimatePresence>
              {(isLoading || isSuccess) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center space-y-4"
                >
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xl border border-slate-800">
                      {isSuccess ? <Check className="w-8 h-8 text-emerald-400" /> : <ShieldCheck className="w-8 h-8" />}
                    </div>
                    <div className="absolute -inset-2 rounded-3xl border-2 border-amber-600/30 border-t-amber-500 animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-900">
                      {isSuccess ? 'Access Granted!' : 'Authenticating...'}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                      {isSuccess ? 'Loading Homepage...' : 'Connecting to Supabase'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Top Branding Logo (Image 1 - Navy #25394d) */}
            <motion.div variants={itemVariants} className="flex justify-center mb-4">
              <div className="p-2.5 rounded-2xl bg-amber-900/5 border border-amber-900/10 flex items-center justify-center shadow-2xs">
                <img 
                  src="/logo-navy.svg" 
                  alt="VCARDS SPACE Logo" 
                  className="h-10 w-auto object-contain"
                />
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div variants={itemVariants} className="text-center space-y-1">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1B2A4A]">
                Admin Portal
              </h1>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest font-semibold">
                VCARDS SPACE MANAGEMENT
              </p>
            </motion.div>

            {/* 8-Point Star Divider */}
            <motion.div
              variants={itemVariants}
              className="flex justify-center items-center gap-3 my-5 select-none"
              aria-hidden="true"
            >
              <div className="h-[1px] w-12 bg-amber-900/15" />
              <svg className="w-4 h-4 text-amber-800/70 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
              </svg>
              <div className="h-[1px] w-12 bg-amber-900/15" />
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="p-3.5 bg-red-50/90 border border-red-200/80 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-medium shadow-2xs"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Input */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@vcards.space"
                    className="w-full h-12 pl-10 pr-4 bg-slate-50/80 hover:bg-white focus:bg-white rounded-2xl border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 focus:border-[#1B2A4A] transition-all text-sm font-sans text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </motion.div>

              {/* Password Input */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full h-12 pl-10 pr-11 bg-slate-50/80 hover:bg-white focus:bg-white rounded-2xl border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 focus:border-[#1B2A4A] transition-all text-sm font-sans text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants} className="pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || isSuccess}
                  className={`w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-md cursor-pointer ${
                    isSuccess
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-[#1B2A4A] hover:bg-slate-800 text-white shadow-indigo-900/20'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : isSuccess ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Access Granted</span>
                    </>
                  ) : (
                    <span>Sign In to Dashboard</span>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest pb-2">
        © VCARDS SPACE • SECURED ADMIN PORTAL
      </div>
    </div>
  );
}

