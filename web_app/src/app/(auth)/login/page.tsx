"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function Login() {
  const router = useRouter();
  const [tenant, setTenant] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!tenant.trim()) errs.tenant = 'Informe o nome da empresa (tenant).';
    if (!email.trim()) errs.email = 'Informe o e-mail corporativo.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'E-mail inválido.';
    if (!password.trim()) errs.password = 'Informe a senha.';
    else if (password.length < 6) errs.password = 'A senha deve ter no mínimo 6 caracteres.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setServerError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setServerError('E-mail ou senha incorretos. Verifique suas credenciais.');
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setServerError('Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Informe o e-mail para recuperar a senha.' });
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      alert('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch {
      alert('Erro ao enviar e-mail de recuperação. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row w-full">
      {/* Left Form Side */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-white shadow-2xl z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 flex items-center justify-center mb-4">
              <img src="/logo_v3.png" alt="FleetFlow" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Fleet<span className="text-brand-primary">Flow</span>
            </h2>
            <p className="mt-2 text-sm text-gray-600">Acesse sua frota, relatórios e ocorrências.</p>
          </div>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
              {serverError}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="tenant">Tenant (Cliente/Empresa)</label>
                <input
                  id="tenant"
                  type="text"
                  value={tenant}
                  onChange={(e) => setTenant(e.target.value)}
                  className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm transition-all outline-none ${errors.tenant ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="ex: viacargas"
                  aria-describedby={errors.tenant ? 'tenant-error' : undefined}
                />
                {errors.tenant && <p id="tenant-error" className="mt-1 text-xs text-red-600" role="alert">{errors.tenant}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="email">E-mail Corporativo</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm transition-all outline-none ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="gestor@empresa.com.br"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="password">Senha</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`mt-1 block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm transition-all outline-none ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="••••••••"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                {errors.password && <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">{errors.password}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Manter conectado</label>
              </div>
              <div className="text-sm">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-medium text-brand-primary hover:text-brand-primary/80"
                >
                  Esqueceu a senha?
                </button>
              </div>
            </div>

            <button
              id="btn-entrar"
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Autenticando...
                </>
              ) : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Art Side */}
      <div className="hidden md:flex flex-1 bg-brand-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="z-10 text-center px-12">
          <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-lg">Gestão de Frota Segura</h1>
          <p className="text-white/70 text-lg max-w-lg mx-auto leading-relaxed">
            Integração multi-tenant com segurança de ponta a ponta. Controle sua frota interligada ao aplicativo Mobile e rastreabilidade local.
          </p>
        </div>
      </div>
    </div>
  );
}
