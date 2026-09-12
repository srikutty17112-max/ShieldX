import React, { useState } from 'react';
import { Shield, Lock, Mail, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignupPage = ({ onSwitchToLogin, onBackToLanding }) => {
  const { signup, oauthLogin } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await signup(email, password, fullName);
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setLoading(true);
    setError(null);
    try {
      const idToken = `demo_${provider}_id_token_${Date.now()}`;
      await oauthLogin(provider, idToken, `${provider === 'google' ? 'Google' : 'Apple'} Security Analyst`, `analyst@${provider}.demo`);
    } catch (err) {
      setError(err.message || `${provider} signup failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-950 flex flex-col justify-center py-12 px-6 lg:px-8 relative selection:bg-cyber-green selection:text-black">
      <div className="absolute inset-0 cyber-grid opacity-25 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyber-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        <div className="text-center mb-6">
          <button 
            onClick={onBackToLanding}
            className="inline-flex items-center space-x-2 text-xs font-mono text-cyber-muted hover:text-cyber-green transition-colors mb-4"
          >
            <span>&larr; Back to ShieldX</span>
          </button>
          <div className="flex items-center justify-center space-x-2.5 mb-2">
            <Shield className="w-9 h-9 text-cyber-green" />
            <span className="text-2xl font-bold font-mono tracking-wider text-white">
              SHIELD<span className="text-cyber-green">X</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Deploy New Operator Tenant
          </h2>
          <p className="text-xs text-cyber-muted font-mono mt-1">
            Create your account with multi-tenant cryptographic isolation
          </p>
        </div>

        <div className="bg-cyber-900/80 border border-cyber-border rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-xs font-mono flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-cyber-muted mb-1">
                OPERATOR FULL NAME
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-cyber-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Lead Security Analyst"
                  className="w-full bg-cyber-950 border border-cyber-border focus:border-cyber-green rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-cyber-muted font-mono outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-cyber-muted mb-1">
                OPERATOR EMAIL
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cyber-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@shieldx.io"
                  className="w-full bg-cyber-950 border border-cyber-border focus:border-cyber-green rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-cyber-muted font-mono outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-cyber-muted mb-1">
                PASSWORD (MIN 6 CHARS, BCRYPT SALTED)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cyber-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-cyber-950 border border-cyber-border focus:border-cyber-green rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-cyber-muted font-mono outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-cyber-green hover:bg-cyber-green/90 text-black font-bold font-mono text-xs transition-all shadow-[0_0_12px_rgba(0,255,157,0.25)] flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Account</span>}
              {!loading && <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cyber-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-mono">
              <span className="bg-cyber-900 px-3 text-cyber-muted">Or Instant OAuth</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-cyber-950 hover:bg-cyber-850 border border-cyber-border text-white text-xs font-mono flex items-center justify-center space-x-3 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('apple')}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-cyber-950 hover:bg-cyber-850 border border-cyber-border text-white text-xs font-mono flex items-center justify-center space-x-3 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.59.69-1.12 1.81-.98 2.91 1.07.08 2.15-.55 2.79-1.31z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          <div className="pt-4 mt-4 border-t border-cyber-border/40 text-center">
            <span className="text-xs text-cyber-muted font-mono">Already have an account? </span>
            <button
              onClick={onSwitchToLogin}
              className="text-xs font-mono text-cyber-green hover:underline font-semibold"
            >
              Sign in here
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
