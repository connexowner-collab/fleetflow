"use client";

import { useState } from 'react';
import { Settings, Building, Palette, Bell, Shield, Save, CheckCircle } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState('ViaCargas Transportes');
  const [corPrimaria, setCorPrimaria] = useState('#0056B3');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifGrave, setNotifGrave] = useState(true);
  const [notifChecklist, setNotifChecklist] = useState(false);
  const [sessaoTimeout, setSessaoTimeout] = useState('60');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSalvar = () => {
    showToast('✅ Configurações salvas com sucesso!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-in slide-in-from-right">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Settings className="w-8 h-8 mr-3 text-brand-primary" />
            Configurações
          </h1>
          <p className="text-gray-500 mt-1">Ajuste as preferências da sua empresa e da plataforma.</p>
        </div>
        <button
          onClick={handleSalvar}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-primary/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <Save className="w-5 h-5" />
          Salvar Alterações
        </button>
      </div>

      {/* Empresa */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center mb-6">
          <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary mr-3">
            <Building className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Dados da Empresa (Tenant)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nome da Empresa</label>
            <input
              type="text"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Identificador (Slug)</label>
            <input
              type="text"
              value="viacargas"
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-400">O slug não pode ser alterado.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">CNPJ</label>
            <input
              type="text"
              placeholder="00.000.000/0001-00"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail de Contato</label>
            <input
              type="email"
              placeholder="contato@empresa.com.br"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm"
            />
          </div>
        </div>
      </div>

      {/* Aparência */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center mb-6">
          <div className="p-2.5 bg-purple-100 rounded-xl text-purple-600 mr-3">
            <Palette className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Aparência e Tema</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cor Primária da Marca</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer p-1"
              />
              <input
                type="text"
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Logotipo da Empresa</label>
            <button
              onClick={() => showToast('📁 Upload de logo em desenvolvimento.')}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-brand-primary hover:text-brand-primary transition-colors"
            >
              Clique para fazer upload do logo
            </button>
          </div>
        </div>
      </div>

      {/* Notificações */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center mb-6">
          <div className="p-2.5 bg-yellow-100 rounded-xl text-yellow-600 mr-3">
            <Bell className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Notificações</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Alertas por e-mail', desc: 'Receba resumos diários da operação no seu e-mail.', state: notifEmail, set: setNotifEmail },
            { label: 'Alertas de ocorrência grave', desc: 'Notifique imediatamente quando uma ocorrência grave for registrada.', state: notifGrave, set: setNotifGrave },
            { label: 'Checklists pendentes de revisão', desc: 'Lembre automaticamente quando houver checklists esperando aprovação.', state: notifChecklist, set: setNotifChecklist },
          ].map((item) => (
            <label key={item.label} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <div>
                <span className="block text-sm font-semibold text-gray-900">{item.label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{item.desc}</span>
              </div>
              <button
                type="button"
                onClick={() => item.set(!item.state)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${item.state ? 'bg-brand-primary' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${item.state ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>
          ))}
        </div>
      </div>

      {/* Segurança */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center mb-6">
          <div className="p-2.5 bg-green-100 rounded-xl text-green-600 mr-3">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Segurança</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Timeout de Sessão (minutos)</label>
            <select
              value={sessaoTimeout}
              onChange={(e) => setSessaoTimeout(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm bg-white"
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
              <option value="120">2 horas</option>
              <option value="0">Nunca expirar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Autenticação de Dois Fatores</label>
            <button
              onClick={() => showToast('🔐 2FA em desenvolvimento para próxima versão.')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left flex items-center justify-between"
            >
              <span>Configurar 2FA</span>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">Em breve</span>
            </button>
          </div>
        </div>
      </div>

      <div className="pb-8 flex justify-end">
        <button
          onClick={handleSalvar}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-brand-primary/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <CheckCircle className="w-5 h-5" />
          Salvar Todas as Configurações
        </button>
      </div>
    </div>
  );
}
