"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Truck, Users, Activity, Wrench, Search, Plus, X, CheckCircle,
  Eye, Pencil, Trash2, AlertTriangle, FileText, ClipboardList,
  ChevronDown, Calendar, Save, ExternalLink
} from 'lucide-react';
import { useCurrentUser, canDeleteVehicle, canManageFleet } from '@/hooks/useCurrentUser';

// ── Tipos ─────────────────────────────────────────────────

type DocStatus = 'ok' | 'alerta' | 'vencido' | 'sem-data'

type Documento = {
  id: string
  tipo: string
  numero: string | null
  data_vencimento: string | null
  observacao: string | null
}

type ChecklistItem = {
  id: string
  codigo: string
  motorista_nome: string
  status: string
  created_at: string
  placa: string
  km_atual: number | null
  tipo_checklist: string | null
}

type Vehicle = {
  id: string
  placa: string
  modelo: string
  marca: string | null
  tipo: string | null
  capacidade: string | null
  combustivel: string | null
  cor: string | null
  renavam: string | null
  chassi: string | null
  filial: string | null
  ano_fabricacao: number | null
  ano_modelo: number | null
  km_atual: number | null
  status: string
  device_id: string | null
  created_at: string
  profiles?: { nome?: string } | null
  documentos: Documento[]
  doc_status: DocStatus
}

type FormData = {
  placa: string; modelo: string; marca: string; tipo: string; combustivel: string
  cor: string; renavam: string; chassi: string; filial: string
  ano_fabricacao: string; ano_modelo: string; capacidade: string; device_id: string
}

const EMPTY_FORM: FormData = {
  placa: '', modelo: '', marca: '', tipo: '', combustivel: '',
  cor: '', renavam: '', chassi: '', filial: '', ano_fabricacao: '',
  ano_modelo: '', capacidade: '', device_id: '',
}

const TIPOS = ['Carro', 'Van', 'Caminhão', 'Moto', 'Outro']
const COMBUSTIVEIS = ['Gasolina', 'Etanol', 'Flex', 'Diesel', 'Elétrico', 'Híbrido']
const STATUS_OPTIONS = ['Ativo', 'Inativo', 'Em Manutenção', 'Disponível', 'Em Rota']

const statusStyles: Record<string, string> = {
  'Em Rota':       'bg-blue-100 text-blue-700 border-blue-200',
  'Disponível':    'bg-green-100 text-green-700 border-green-200',
  'Ativo':         'bg-green-100 text-green-700 border-green-200',
  'Inativo':       'bg-gray-100 text-gray-600 border-gray-200',
  'Em Manutenção': 'bg-orange-100 text-orange-700 border-orange-200',
  'Sinistrado':    'bg-red-100 text-red-700 border-red-200',
}

const docBadge: Record<DocStatus, { label: string; cls: string }> = {
  'ok':       { label: 'OK',       cls: 'bg-green-100 text-green-700 border-green-200' },
  'alerta':   { label: 'Alerta',   cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'vencido':  { label: 'Vencido',  cls: 'bg-red-100 text-red-700 border-red-200' },
  'sem-data': { label: 'Pendente', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
}

const ckStatusCls: Record<string, string> = {
  'Aprovado':       'bg-green-100 text-green-700',
  'Validado':       'bg-emerald-100 text-emerald-800',
  'Pendente':       'bg-blue-100 text-blue-700',
  'Com Pendências': 'bg-amber-100 text-amber-700',
  'Recusado':       'bg-red-100 text-red-700',
  'Avaria Grave':   'bg-red-100 text-red-800',
}

// ── Validações ───────────────────────────────────────────

function validarForm(f: FormData): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.placa.trim()) e.placa = 'Obrigatório.'
  else {
    const p = f.placa.toUpperCase().replace('-', '')
    if (!/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(p) && !/^[A-Z]{3}[0-9]{4}$/.test(p))
      e.placa = 'Placa inválida. Use ABC-1234 ou ABC1D23.'
  }
  if (!f.modelo.trim()) e.modelo = 'Obrigatório.'
  if (!f.marca.trim()) e.marca = 'Obrigatório.'
  if (!f.tipo) e.tipo = 'Obrigatório.'
  if (!f.combustivel) e.combustivel = 'Obrigatório.'
  if (!f.cor.trim()) e.cor = 'Obrigatório.'
  if (!f.renavam.trim()) e.renavam = 'Obrigatório.'
  else if (![9,11].includes(f.renavam.replace(/\D/g,'').length)) e.renavam = 'RENAVAM deve ter 9 ou 11 dígitos.'
  if (!f.chassi.trim()) e.chassi = 'Obrigatório.'
  else if (f.chassi.trim().length !== 17) e.chassi = 'Chassi deve ter 17 caracteres.'
  if (!f.filial.trim()) e.filial = 'Obrigatório.'
  if (!f.ano_fabricacao) e.ano_fabricacao = 'Obrigatório.'
  else if (!/^\d{4}$/.test(f.ano_fabricacao)) e.ano_fabricacao = 'Ano inválido.'
  if (!f.ano_modelo) e.ano_modelo = 'Obrigatório.'
  else if (!/^\d{4}$/.test(f.ano_modelo)) e.ano_modelo = 'Ano inválido.'
  return e
}

function calcDocStatus(docs: { data_vencimento: string | null }[]): DocStatus {
  if (!docs.length) return 'sem-data'
  const hoje = new Date(); const em30 = new Date(); em30.setDate(hoje.getDate() + 30)
  let s: DocStatus = 'sem-data'
  for (const d of docs) {
    if (!d.data_vencimento) continue
    const v = new Date(d.data_vencimento + 'T00:00:00')
    if (v < hoje) return 'vencido'
    if (v <= em30) s = 'alerta'
    else if (s === 'sem-data') s = 'ok'
  }
  return s
}

// ── Componente Principal ─────────────────────────────────

export default function FleetPage() {
  const currentUser = useCurrentUser()
  const userPerfil = currentUser?.perfil ?? 'motorista'
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filiais, setFiliais] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [filterDoc, setFilterDoc] = useState<string[]>([])
  const [filterFilial, setFilterFilial] = useState('')
  const [loading, setLoading] = useState(true)

  // Modais de CRUD
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)

  // Drawers
  const [docsDrawer, setDocsDrawer] = useState<Vehicle | null>(null)
  const [checklistDrawer, setChecklistDrawer] = useState<Vehicle | null>(null)
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null)

  // Documentos editáveis
  const [docsEdit, setDocsEdit] = useState<Documento[]>([])
  const [docsSaving, setDocsSaving] = useState<string | null>(null)

  // Checklists do veículo
  const [checklists, setChecklists] = useState<ChecklistItem[]>([])
  const [checklistsLoading, setChecklistsLoading] = useState(false)

  // Toggle status
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  // Form
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Importação em lote
  type ImportError = { row: number; erros: string[] }
  type ImportResult = {
    ok: boolean
    totalRows?: number
    validCount?: number
    errorCount?: number
    errors?: ImportError[]
    validRows?: Record<string, unknown>[]
    imported?: number
  }
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const importFileRef = useRef<HTMLInputElement>(null)

  // ── Fetch ──────────────────────────────────────────────

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/admin/frota')
      const json = await res.json()
      setVehicles(json.veiculos ?? [])
    } catch { setVehicles([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchVehicles()
    fetch('/api/admin/config?categoria=unidade')
      .then(r => r.json())
      .then(d => setFiliais((d.opcoes ?? []).map((o: {valor:string}) => o.valor)))
      .catch(() => setFiliais(['Filial São Paulo','Filial Campinas','Filial Ribeirão Preto','Filial Guarulhos']))
  }, [])

  // Fecha dropdown de status ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node))
        setStatusDropdown(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Toast ──────────────────────────────────────────────

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Form helpers ───────────────────────────────────────

  const setField = (key: keyof FormData, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }))
    if (formErrors[key]) setFormErrors(prev => { const e={...prev}; delete e[key]; return e })
  }

  const openCadastro = () => { setForm(EMPTY_FORM); setFormErrors({}); setEditingId(null); setModalOpen(true) }

  const openEditar = (v: Vehicle) => {
    setForm({
      placa: v.placa, modelo: v.modelo, marca: v.marca ?? '', tipo: v.tipo ?? '',
      combustivel: v.combustivel ?? '', cor: v.cor ?? '', renavam: v.renavam ?? '',
      chassi: v.chassi ?? '', filial: v.filial ?? '',
      ano_fabricacao: v.ano_fabricacao?.toString() ?? '', ano_modelo: v.ano_modelo?.toString() ?? '',
      capacidade: v.capacidade ?? '', device_id: v.device_id ?? '',
    })
    setFormErrors({}); setEditingId(v.id); setModalOpen(true)
  }

  const handleSalvar = async () => {
    const errs = validarForm(form)
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/frota', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      await fetchVehicles()
      setModalOpen(false)
      showToast(editingId ? '✅ Veículo atualizado!' : '✅ Veículo cadastrado!')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error')
    } finally { setSaving(false) }
  }

  const handleExcluir = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch('/api/admin/frota', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      await fetchVehicles(); setDeleteTarget(null)
      showToast('✅ Veículo excluído.')
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Erro.', 'error') }
  }

  // ── Toggle Status ──────────────────────────────────────

  const handleStatusChange = async (vehicleId: string, novoStatus: string) => {
    setStatusDropdown(null)
    try {
      const res = await fetch('/api/admin/veiculos', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vehicleId, status: novoStatus }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, status: novoStatus } : v))
      showToast('✅ Status atualizado.')
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Erro.', 'error') }
  }

  // ── Drawer Documentos ──────────────────────────────────

  const openDocsDrawer = async (v: Vehicle) => {
    setDocsDrawer(v)
    try {
      const res = await fetch(`/api/admin/frota/documentos?veiculo_id=${v.id}`)
      const json = await res.json()
      setDocsEdit(json.documentos ?? [])
    } catch { setDocsEdit(v.documentos) }
  }

  const handleSaveDoc = async (doc: Documento) => {
    setDocsSaving(doc.id)
    try {
      const res = await fetch('/api/admin/frota/documentos', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id, numero: doc.numero, data_vencimento: doc.data_vencimento, observacao: doc.observacao }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      await fetchVehicles()
      showToast(`✅ ${doc.tipo} atualizado.`)
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : 'Erro.', 'error') }
    finally { setDocsSaving(null) }
  }

  const updateDocField = (id: string, field: keyof Documento, value: string) => {
    setDocsEdit(prev => prev.map(d => d.id === id ? { ...d, [field]: value || null } : d))
  }

  // ── Drawer Checklists ──────────────────────────────────

  const openChecklistDrawer = async (v: Vehicle) => {
    setChecklistDrawer(v)
    setChecklistsLoading(true)
    try {
      const res = await fetch(`/api/admin/frota/checklists?veiculo_id=${v.id}&placa=${v.placa}`)
      const json = await res.json()
      setChecklists(json.checklists ?? [])
    } catch { setChecklists([]) }
    finally { setChecklistsLoading(false) }
  }

  // ── Importação em lote ────────────────────────────────

  const handleImportUpload = async () => {
    if (!importFile) return
    setImporting(true)
    setImportResult(null)
    try {
      const fd = new FormData()
      fd.append('file', importFile)
      const res = await fetch('/api/admin/frota/importar', { method: 'POST', body: fd })
      const json: ImportResult = await res.json()
      setImportResult(json)
      if (json.ok) {
        await fetchVehicles()
        showToast(`✅ ${json.imported} veículo(s) importado(s) com sucesso!`)
        setImportModalOpen(false)
        setImportFile(null)
        setImportResult(null)
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao importar.', 'error')
    } finally { setImporting(false) }
  }

  const handleImportConfirmPartial = async () => {
    if (!importResult?.validRows?.length) return
    setImporting(true)
    try {
      const res = await fetch('/api/admin/frota/importar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validRows: importResult.validRows }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      await fetchVehicles()
      showToast(`✅ ${json.imported} veículo(s) importado(s) com sucesso!`)
      setImportModalOpen(false)
      setImportFile(null)
      setImportResult(null)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao importar.', 'error')
    } finally { setImporting(false) }
  }

  // ── Filtros ────────────────────────────────────────────

  const filtered = vehicles.filter(v => {
    if (search) {
      const q = search.toLowerCase()
      const match = v.placa.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q) ||
        (v.marca ?? '').toLowerCase().includes(q) ||
        (v.profiles?.nome ?? '').toLowerCase().includes(q) ||
        (v.filial ?? '').toLowerCase().includes(q)
      if (!match) return false
    }
    if (filterStatus.length > 0 && !filterStatus.includes(v.status)) return false
    if (filterDoc.length > 0 && !filterDoc.includes(v.doc_status)) return false
    if (filterFilial && v.filial !== filterFilial) return false
    return true
  })

  const toggleFilter = (list: string[], setList: (v: string[]) => void, val: string) => {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val])
  }

  const hasFilters = filterStatus.length > 0 || filterDoc.length > 0 || !!filterFilial

  const stats = [
    { label: 'Total Veículos',  value: vehicles.length,                                                icon: Truck,    color: 'text-brand-primary' },
    { label: 'Em Operação',     value: vehicles.filter(v => ['Em Rota','Ativo','Disponível'].includes(v.status)).length, icon: Activity, color: 'text-blue-600' },
    { label: 'Em Manutenção',   value: vehicles.filter(v => v.status === 'Em Manutenção').length,       icon: Wrench,   color: 'text-orange-600' },
    { label: 'Inativos',        value: vehicles.filter(v => v.status === 'Inativo').length,             icon: Users,    color: 'text-gray-500' },
  ]

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-4">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-[100] px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-right ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestão da Frota</h1>
          <p className="text-sm text-gray-400 mt-0.5">Cadastre, edite e monitore todos os veículos da operação.</p>
        </div>
        {canManageFleet(userPerfil) && (
          <div className="flex gap-3">
            <button
              onClick={() => window.open('/api/admin/frota/importar', '_blank')}
              className="border border-brand-primary text-brand-primary hover:bg-brand-primary/5 px-5 py-3 rounded-xl font-bold flex items-center transition-all active:scale-95 text-sm"
              title="Baixar template e importar veículos em lote"
            >
              <ExternalLink className="w-4 h-4 mr-2" />Template
            </button>
            <button
              onClick={() => { setImportModalOpen(true); setImportFile(null); setImportResult(null) }}
              className="border border-brand-primary text-brand-primary hover:bg-brand-primary/5 px-5 py-3 rounded-xl font-bold flex items-center transition-all active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />Importar
            </button>
            <button onClick={openCadastro}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-primary/20 flex items-center transition-all active:scale-95">
              <Plus className="w-5 h-5 mr-2" />Novo Veículo
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className={`p-2.5 bg-gray-50 rounded-xl ${s.color} shrink-0`}><s.icon className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">{s.label}</p>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 space-y-3">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por placa, modelo, marca, motorista..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-brand-primary outline-none text-sm" />
          </div>
          {/* Filtros */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtrar:</span>
            {/* Status */}
            {(['Ativo','Disponível','Em Rota','Em Manutenção','Inativo'] as string[]).map(s => (
              <button key={s} onClick={() => toggleFilter(filterStatus, setFilterStatus, s)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  filterStatus.includes(s)
                    ? `${statusStyles[s]} shadow-sm`
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                }`}>
                {s}
              </button>
            ))}
            <div className="w-px h-4 bg-gray-200" />
            {/* Documentação */}
            {(['ok','alerta','vencido','sem-data'] as DocStatus[]).map(d => (
              <button key={d} onClick={() => toggleFilter(filterDoc, setFilterDoc, d)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  filterDoc.includes(d)
                    ? `${docBadge[d].cls} shadow-sm`
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                }`}>
                Docs: {docBadge[d].label}
              </button>
            ))}
            {/* Filial */}
            {filiais.length > 0 && (
              <>
                <div className="w-px h-4 bg-gray-200" />
                <select value={filterFilial} onChange={e => setFilterFilial(e.target.value)}
                  className="px-3 py-1 rounded-full text-xs font-bold border bg-gray-50 text-gray-500 border-gray-200 outline-none hover:border-gray-300 cursor-pointer">
                  <option value="">Todas as filiais</option>
                  {filiais.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </>
            )}
            {/* Limpar */}
            {hasFilters && (
              <button onClick={() => { setFilterStatus([]); setFilterDoc([]); setFilterFilial('') }}
                className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all flex items-center gap-1">
                <X className="w-3 h-3" />Limpar filtros
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">Carregando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{search ? `Nenhum resultado para "${search}"` : 'Nenhum veículo cadastrado.'}</p>
          </div>
        ) : (
          <>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {filtered.map(v => (
              <div key={v.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary/5 rounded-xl flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-brand-primary/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-gray-900">{v.placa}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${statusStyles[v.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {v.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{v.marca} {v.modelo}{v.ano_modelo ? ` · ${v.ano_modelo}` : ''}</p>
                  <p className="text-xs text-gray-400 truncate">{v.filial ?? '—'}{v.profiles?.nome ? ` · ${v.profiles.nome}` : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setDetailVehicle(v)} className="p-2 text-gray-400 hover:text-brand-primary transition-colors"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => openEditar(v)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-xs font-black uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4">Veículo</th>
                  <th className="px-4 py-4">Marca / Tipo</th>
                  <th className="px-4 py-4">Filial</th>
                  <th className="px-4 py-4">Motorista</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-4 py-4 text-center">Docs</th>
                  <th className="px-4 py-4 text-center">Cadastro</th>
                  <th className="px-4 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50/40 transition-colors">
                    {/* Veículo */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-brand-primary/5 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <Truck className="w-6 h-6 text-brand-primary/60" />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 leading-none mb-1">{v.placa}</p>
                          <p className="text-xs text-gray-500">{v.modelo}{v.ano_modelo ? ` · ${v.ano_modelo}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    {/* Marca / Tipo */}
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-gray-800">{v.marca ?? '—'}</p>
                      <p className="text-xs text-gray-400">{v.tipo ?? '—'}</p>
                    </td>
                    {/* Filial */}
                    <td className="px-4 py-4 text-sm text-gray-700">{v.filial ?? '—'}</td>
                    {/* Motorista */}
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center mr-2 text-[10px] font-bold text-gray-600 flex-shrink-0">
                          {v.profiles?.nome ? v.profiles.nome.substring(0,2).toUpperCase() : '—'}
                        </div>
                        <p className="text-sm text-gray-700">{v.profiles?.nome ?? 'Sem vínculo'}</p>
                      </div>
                    </td>
                    {/* Status — toggle dropdown */}
                    <td className="px-4 py-4 text-center">
                      <div className="relative inline-block" ref={statusDropdown === v.id ? statusRef : null}>
                        <button
                          onClick={() => setStatusDropdown(prev => prev === v.id ? null : v.id)}
                          className={`px-2.5 py-1 text-[10px] font-black rounded-full border flex items-center gap-1 transition-all hover:opacity-80 ${statusStyles[v.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                        >
                          {v.status.toUpperCase()}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {statusDropdown === v.id && (
                          <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 min-w-[160px] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            {STATUS_OPTIONS.map(s => (
                              <button key={s} onClick={() => handleStatusChange(v.id, s)}
                                className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-gray-50 transition-colors ${v.status === s ? 'text-brand-primary' : 'text-gray-700'}`}>
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Docs badge */}
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => openDocsDrawer(v)}
                        className={`px-2.5 py-1 text-[10px] font-black rounded-full border hover:opacity-80 transition-all ${docBadge[v.doc_status].cls}`}>
                        {docBadge[v.doc_status].label.toUpperCase()}
                      </button>
                    </td>
                    {/* Data cadastro */}
                    <td className="px-4 py-4 text-center">
                      <p className="text-xs text-gray-500">{new Date(v.created_at).toLocaleDateString('pt-BR')}</p>
                    </td>
                    {/* Ações */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => setDetailVehicle(v)} className="p-2 text-gray-400 hover:text-brand-primary transition-colors" title="Detalhes"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditar(v)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Editar"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => openChecklistDrawer(v)} className="p-2 text-gray-400 hover:text-purple-600 transition-colors" title="Histórico de Checklist"><ClipboardList className="w-4 h-4" /></button>
                        <button onClick={() => openDocsDrawer(v)} className="p-2 text-gray-400 hover:text-orange-500 transition-colors" title="Documentos"><FileText className="w-4 h-4" /></button>
                        {canDeleteVehicle(userPerfil) && (
                          <button onClick={() => setDeleteTarget(v)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* ── Modal Cadastro / Edição ─────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-black text-gray-900">{editingId ? 'Editar Veículo' : 'Cadastrar Veículo'}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Campos com <span className="text-red-500">*</span> são obrigatórios.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="px-8 py-6 space-y-6">
              <Section title="Identificação">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Placa" required error={formErrors.placa}>
                    <input value={form.placa} onChange={e => setField('placa', e.target.value.toUpperCase())} placeholder="ABC-1234 ou ABC1D23" className={ic(formErrors.placa)} maxLength={8} />
                  </Field>
                  <Field label="Marca" required error={formErrors.marca}>
                    <input value={form.marca} onChange={e => setField('marca', e.target.value)} placeholder="Ex: Mercedes-Benz" className={ic(formErrors.marca)} />
                  </Field>
                  <Field label="Modelo" required error={formErrors.modelo}>
                    <input value={form.modelo} onChange={e => setField('modelo', e.target.value)} placeholder="Ex: Actros 2651" className={ic(formErrors.modelo)} />
                  </Field>
                  <Field label="Tipo" required error={formErrors.tipo}>
                    <select value={form.tipo} onChange={e => setField('tipo', e.target.value)} className={ic(formErrors.tipo)}>
                      <option value="">Selecione...</option>
                      {TIPOS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Ano Fabricação" required error={formErrors.ano_fabricacao}>
                    <input value={form.ano_fabricacao} onChange={e => setField('ano_fabricacao', e.target.value)} placeholder="Ex: 2022" maxLength={4} className={ic(formErrors.ano_fabricacao)} />
                  </Field>
                  <Field label="Ano Modelo" required error={formErrors.ano_modelo}>
                    <input value={form.ano_modelo} onChange={e => setField('ano_modelo', e.target.value)} placeholder="Ex: 2023" maxLength={4} className={ic(formErrors.ano_modelo)} />
                  </Field>
                  <Field label="Combustível" required error={formErrors.combustivel}>
                    <select value={form.combustivel} onChange={e => setField('combustivel', e.target.value)} className={ic(formErrors.combustivel)}>
                      <option value="">Selecione...</option>
                      {COMBUSTIVEIS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Cor" required error={formErrors.cor}>
                    <input value={form.cor} onChange={e => setField('cor', e.target.value)} placeholder="Ex: Branco" className={ic(formErrors.cor)} />
                  </Field>
                </div>
              </Section>
              <Section title="Documentação">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="RENAVAM" required error={formErrors.renavam}>
                    <input value={form.renavam} onChange={e => setField('renavam', e.target.value.replace(/\D/g,''))} placeholder="9 ou 11 dígitos" maxLength={11} className={ic(formErrors.renavam)} />
                  </Field>
                  <Field label="Chassi" required error={formErrors.chassi}>
                    <input value={form.chassi} onChange={e => setField('chassi', e.target.value.toUpperCase())} placeholder="17 caracteres" maxLength={17} className={ic(formErrors.chassi)} />
                    {form.chassi && <p className="text-[11px] text-gray-400 mt-1">{form.chassi.length}/17</p>}
                  </Field>
                </div>
              </Section>
              <Section title="Operacional">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Filial" required error={formErrors.filial}>
                    <select value={form.filial} onChange={e => setField('filial', e.target.value)} className={ic(formErrors.filial)}>
                      <option value="">Selecione...</option>
                      {filiais.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label="Capacidade de Carga">
                    <input value={form.capacidade} onChange={e => setField('capacidade', e.target.value)} placeholder="Ex: 30t" className={ic()} />
                  </Field>
                  <Field label="Identificador GPS" hint="Para integração futura">
                    <input value={form.device_id} onChange={e => setField('device_id', e.target.value)} placeholder="ID do rastreador" className={ic()} />
                  </Field>
                </div>
              </Section>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-4 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSalvar} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 flex items-center justify-center disabled:opacity-60">
                {saving ? <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />Salvando...</> : <><CheckCircle className="w-4 h-4 mr-2" />{editingId ? 'Salvar Alterações' : 'Cadastrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer Documentos ──────────────────────────── */}
      {docsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setDocsDrawer(null)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-black text-gray-900">Documentos</h2>
                <p className="text-sm text-gray-500">{docsDrawer.placa} — {docsDrawer.modelo}</p>
              </div>
              <button onClick={() => setDocsDrawer(null)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {docsEdit.map(doc => {
                const status = calcDocStatus([doc])
                return (
                  <div key={doc.id} className={`rounded-2xl border p-5 space-y-3 ${docBadge[status].cls}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm">{doc.tipo}</span>
                      <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${docBadge[status].cls}`}>
                        {docBadge[status].label.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-2 bg-white/70 rounded-xl p-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Número / Apólice</label>
                        <input value={doc.numero ?? ''} onChange={e => updateDocField(doc.id, 'numero', e.target.value)}
                          placeholder="Identificador do documento"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-primary" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />Data de Vencimento</label>
                        <input type="date" value={doc.data_vencimento ?? ''} onChange={e => updateDocField(doc.id, 'data_vencimento', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-primary" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Observação</label>
                        <input value={doc.observacao ?? ''} onChange={e => updateDocField(doc.id, 'observacao', e.target.value)}
                          placeholder="Opcional"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-primary" />
                      </div>
                      <button onClick={() => handleSaveDoc(doc)} disabled={docsSaving === doc.id}
                        className="w-full py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-700 flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
                        {docsSaving === doc.id ? <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-3 h-3" />}
                        Salvar {doc.tipo}
                      </button>
                    </div>
                  </div>
                )
              })}
              {docsEdit.length === 0 && (
                <div className="text-center text-gray-400 py-10">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum documento encontrado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer Checklist ───────────────────────────── */}
      {checklistDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setChecklistDrawer(null)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-black text-gray-900">Histórico de Checklist</h2>
                <p className="text-sm text-gray-500">{checklistDrawer.placa} — {checklistDrawer.modelo}</p>
              </div>
              <button onClick={() => setChecklistDrawer(null)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {checklistsLoading ? (
                <div className="text-center py-10">
                  <div className="animate-spin w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full mx-auto" />
                </div>
              ) : checklists.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum checklist encontrado para este veículo.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {checklists.map(ck => (
                    <div key={ck.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-gray-900">{ck.codigo}</p>
                        {ck.tipo_checklist && (
                          <p className="text-xs font-semibold text-indigo-600">{ck.tipo_checklist}</p>
                        )}
                        <p className="text-xs text-gray-500">{ck.motorista_nome}</p>
                        <p className="text-xs text-gray-400">{new Date(ck.created_at).toLocaleString('pt-BR')}</p>
                        {ck.km_atual && <p className="text-xs text-gray-400">{ck.km_atual.toLocaleString('pt-BR')} km</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-full ${ckStatusCls[ck.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {ck.status.toUpperCase()}
                        </span>
                        <button
                          disabled
                          title="PDF não disponível"
                          className="flex items-center gap-1 text-[10px] font-bold text-gray-400 disabled:opacity-40 border border-gray-200 rounded-lg px-2 py-1"
                        >
                          <ExternalLink className="w-3 h-3" />PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Detalhes ─────────────────────────────── */}
      {detailVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setDetailVehicle(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mr-4">
                  <Truck className="w-7 h-7 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">{detailVehicle.placa}</h2>
                  <p className="text-sm text-gray-500">{detailVehicle.marca} {detailVehicle.modelo}</p>
                </div>
              </div>
              <button onClick={() => setDetailVehicle(null)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-2">
              {[
                ['Tipo', detailVehicle.tipo ?? '—'],
                ['Combustível', detailVehicle.combustivel ?? '—'],
                ['Cor', detailVehicle.cor ?? '—'],
                ['Ano Fab. / Modelo', `${detailVehicle.ano_fabricacao ?? '—'} / ${detailVehicle.ano_modelo ?? '—'}`],
                ['RENAVAM', detailVehicle.renavam ?? '—'],
                ['Chassi', detailVehicle.chassi ?? '—'],
                ['Filial', detailVehicle.filial ?? '—'],
                ['Capacidade', detailVehicle.capacidade ?? '—'],
                ['KM Atual', detailVehicle.km_atual ? detailVehicle.km_atual.toLocaleString('pt-BR') + ' km' : '—'],
                ['Motorista', detailVehicle.profiles?.nome ?? 'Sem vínculo'],
                ['Status', detailVehicle.status],
                ['Cadastro', new Date(detailVehicle.created_at).toLocaleDateString('pt-BR')],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-bold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => { openEditar(detailVehicle); setDetailVehicle(null) }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center">
                <Pencil className="w-4 h-4 mr-2" />Editar
              </button>
              <button onClick={() => { openDocsDrawer(detailVehicle); setDetailVehicle(null) }}
                className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 flex items-center justify-center">
                <FileText className="w-4 h-4 mr-2" />Ver Documentos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Excluir ──────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center mb-5">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Excluir Veículo</h2>
                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 mb-6">
              Veículo <strong>{deleteTarget.placa}</strong> — {deleteTarget.modelo} será removido.
              {deleteTarget.profiles?.nome && <><br />Motorista <strong>{deleteTarget.profiles.nome}</strong> será desvinculado automaticamente.</>}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleExcluir} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700">Sim, excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Importação ──────────────────────────────── */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => !importing && setImportModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-black text-gray-900">Importar Veículos em Lote</h2>
                <p className="text-sm text-gray-500">Selecione um arquivo .xlsx com os dados dos veículos.</p>
              </div>
              <button onClick={() => setImportModalOpen(false)} disabled={importing} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!importResult ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                  <p className="font-bold mb-1">Colunas obrigatórias:</p>
                  <p className="font-mono text-xs">placa · modelo · marca · tipo · combustivel · cor · renavam · chassi · filial · ano_fabricacao · ano_modelo</p>
                  <p className="mt-2">Opcional: capacidade · device_id</p>
                  <button
                    onClick={() => window.open('/api/admin/frota/importar', '_blank')}
                    className="mt-3 inline-flex items-center text-blue-600 hover:underline text-xs font-bold"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />Baixar template .xlsx
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Arquivo .xlsx</label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand-primary/50 transition-colors"
                    onClick={() => importFileRef.current?.click()}
                  >
                    {importFile ? (
                      <div>
                        <p className="font-bold text-gray-800">{importFile.name}</p>
                        <p className="text-sm text-gray-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">Clique para selecionar ou arraste o arquivo</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={e => setImportFile(e.target.files?.[0] ?? null)}
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setImportModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancelar</button>
                  <button
                    onClick={handleImportUpload}
                    disabled={!importFile || importing}
                    className="flex-1 py-3 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? 'Validando...' : 'Validar e Importar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Resumo */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-gray-900">{importResult.totalRows ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Total de linhas</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-green-700">{importResult.validCount ?? 0}</p>
                    <p className="text-xs text-green-600 mt-1">Válidas</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-red-700">{importResult.errorCount ?? 0}</p>
                    <p className="text-xs text-red-600 mt-1">Com erros</p>
                  </div>
                </div>

                {/* Erros */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-red-700 mb-3">Linhas com erros:</h3>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {importResult.errors.map(e => (
                        <div key={e.row} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-xs font-bold text-red-700">Linha {e.row}</p>
                          <ul className="mt-1 space-y-0.5">
                            {e.erros.map((msg, i) => (
                              <li key={i} className="text-xs text-red-600">• {msg}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setImportResult(null); setImportFile(null) }}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Voltar
                  </button>
                  {(importResult.validCount ?? 0) > 0 && (
                    <button
                      onClick={handleImportConfirmPartial}
                      disabled={importing}
                      className="flex-1 py-3 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 disabled:opacity-50"
                    >
                      {importing ? 'Importando...' : `Importar ${importResult.validCount} válida(s)`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers de UI ─────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="text-gray-400 font-normal ml-1">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function ic(error?: string) {
  return `w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}`
}
