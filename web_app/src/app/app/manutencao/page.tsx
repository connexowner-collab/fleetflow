"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Wrench, Plus, X, Clock, CheckCircle2,
  AlertTriangle, Info, Download, Eye, Paperclip, FileText,
  ChevronDown, ChevronUp, Calendar, Filter, Loader2, Image as ImageIcon,
} from 'lucide-react'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

// ─── Types ──────────────────────────────────────────────────────────────────

type StatusManutencao =
  | 'Aguardando Atendimento'
  | 'Aguardando Manutenção'
  | 'Em Manutenção'
  | 'Concluída'
  | 'Recusada'
  | 'Cancelada'

type Urgencia = 'muito_alta' | 'alta' | 'media' | 'baixa'
type Motivo   = 'Revisão' | 'Corretiva' | 'Preventiva' | 'Manutenção Sinistro' | 'Emergência'

interface TimelineEntry {
  id: string
  status: StatusManutencao
  ator: string
  data: string
  observacao?: string
}

interface LogEntry {
  id: string
  timestamp: string
  ator: string
  acao: string
}

interface Anexo {
  id: string
  nome: string
  url: string
  tipo: string   // 'image' | 'other'
  tamanho: number
}

interface Manutencao {
  id: string
  data_abertura: string
  motivo: Motivo
  urgencia: Urgencia
  descricao: string
  km: number
  status: StatusManutencao
  observacao_recusa?: string
  timeline: TimelineEntry[]
  log: LogEntry[]
  anexos: Anexo[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<StatusManutencao, { label: string; cls: string }> = {
  'Aguardando Atendimento': { label: 'Aguardando Atendimento', cls: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' },
  'Aguardando Manutenção':  { label: 'Aguardando Manutenção',  cls: 'bg-blue-500/20   text-blue-300   border border-blue-500/40'   },
  'Em Manutenção':          { label: 'Em Manutenção',          cls: 'bg-orange-500/20 text-orange-300 border border-orange-500/40' },
  'Concluída':              { label: 'Concluída',              cls: 'bg-green-500/20  text-green-300  border border-green-500/40'  },
  'Recusada':               { label: 'Recusada',               cls: 'bg-red-500/20    text-red-300    border border-red-500/40'    },
  'Cancelada':              { label: 'Cancelada',              cls: 'bg-slate-500/20  text-slate-400  border border-slate-500/40'  },
}

const URGENCIA_BADGE: Record<Urgencia, { label: string; cls: string }> = {
  muito_alta: { label: 'Muito Alta', cls: 'bg-red-600    text-white' },
  alta:       { label: 'Alta',       cls: 'bg-orange-500 text-white' },
  media:      { label: 'Média',      cls: 'bg-yellow-500 text-slate-900' },
  baixa:      { label: 'Baixa',      cls: 'bg-slate-500  text-white' },
}

const ALL_STATUS: StatusManutencao[] = [
  'Aguardando Atendimento',
  'Aguardando Manutenção',
  'Em Manutenção',
  'Concluída',
  'Recusada',
  'Cancelada',
]

const MOTIVOS: Motivo[] = ['Revisão', 'Corretiva', 'Preventiva', 'Manutenção Sinistro', 'Emergência']

const URGENCIAS: { value: Urgencia; label: string }[] = [
  { value: 'muito_alta', label: 'Muito Alto' },
  { value: 'alta',       label: 'Alto'       },
  { value: 'media',      label: 'Médio'      },
  { value: 'baixa',      label: 'Baixo'      },
]

const PAGE_SIZE = 20

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtDatetime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ─── Status Timeline Icon ────────────────────────────────────────────────────

function TimelineIcon({ status }: { status: StatusManutencao }) {
  const base = 'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0'
  if (status === 'Concluída')
    return <div className={`${base} bg-green-500/20 border border-green-500`}><CheckCircle2 className="w-4 h-4 text-green-400" /></div>
  if (status === 'Recusada' || status === 'Cancelada')
    return <div className={`${base} bg-red-500/20 border border-red-500`}><X className="w-4 h-4 text-red-400" /></div>
  if (status === 'Em Manutenção')
    return <div className={`${base} bg-orange-500/20 border border-orange-500`}><Wrench className="w-4 h-4 text-orange-400" /></div>
  return <div className={`${base} bg-blue-500/20 border border-blue-500`}><Clock className="w-4 h-4 text-blue-400" /></div>
}

// ─── Badge Components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusManutencao }) {
  const b = STATUS_BADGE[status]
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span>
}

function UrgenciaBadge({ urgencia }: { urgencia: Urgencia }) {
  const b = URGENCIA_BADGE[urgencia]
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span>
}

// ─── Modal de Detalhe ────────────────────────────────────────────────────────

function DetalheModal({ item, onClose }: { item: Manutencao; onClose: () => void }) {
  const [aba, setAba] = useState<'dados' | 'anexos' | 'log'>('dados')
  const [lightbox, setLightbox] = useState<string | null>(null)

  const fotos  = item.anexos.filter(a => a.tipo === 'image')
  const outros = item.anexos.filter(a => a.tipo !== 'image')

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-slate-800">
        <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 text-slate-300 active:bg-slate-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 font-mono truncate">{item.id}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={item.status} />
          </div>
        </div>
        {item.observacao_recusa && (
          <div className="relative group">
            <Info className="w-5 h-5 text-yellow-400" />
            <div className="absolute right-0 top-7 w-64 bg-slate-700 border border-slate-600 rounded-xl p-3 text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
              <p className="font-semibold text-yellow-300 mb-1">Observação</p>
              {item.observacao_recusa}
            </div>
          </div>
        )}
      </div>

      {/* Abas */}
      <div className="flex border-b border-slate-800">
        {(['dados', 'anexos', 'log'] as const).map(a => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
              aba === a ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'
            }`}
          >
            {a === 'dados' ? 'Detalhes' : a === 'anexos' ? 'Anexos' : 'Log'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* ── ABA DADOS ──────────────────────────────────────────────── */}
        {aba === 'dados' && (
          <>
            {/* Linha do tempo */}
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Linha do Tempo</p>
              <div className="relative pl-4">
                {/* linha vertical */}
                <div className="absolute left-[13px] top-3.5 bottom-3.5 w-px bg-slate-700" />
                <div className="space-y-4">
                  {item.timeline.map((t, i) => (
                    <div key={t.id} className="flex items-start gap-3">
                      <TimelineIcon status={t.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold leading-tight">{t.status}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{t.ator}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">{fmtDatetime(t.data)}</p>
                        {t.observacao && (
                          <p className="text-slate-300 text-xs mt-1 italic">"{t.observacao}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dados */}
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
              <Row label="Motivo"   value={item.motivo} />
              <Row label="Urgência" value={<UrgenciaBadge urgencia={item.urgencia} />} />
              <Row label="KM"       value={`${item.km.toLocaleString('pt-BR')} km`} />
              <Row label="Abertura" value={fmtDate(item.data_abertura)} />
              <div>
                <p className="text-xs text-slate-500 mb-1">Descrição</p>
                <p className="text-sm text-slate-200 leading-relaxed">{item.descricao}</p>
              </div>
            </div>

            {/* Observação de recusa */}
            {item.observacao_recusa && (
              <div className="bg-red-900/20 border border-red-700/40 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 text-xs font-semibold mb-1">Motivo da Recusa/Reprovação</p>
                  <p className="text-slate-300 text-sm">{item.observacao_recusa}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── ABA ANEXOS ─────────────────────────────────────────────── */}
        {aba === 'anexos' && (
          <>
            {item.anexos.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">Nenhum anexo.</div>
            )}
            {fotos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Fotos</p>
                <div className="grid grid-cols-3 gap-2">
                  {fotos.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setLightbox(f.url)}
                      className="aspect-square bg-slate-800 rounded-xl overflow-hidden border border-slate-700 active:opacity-75"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.nome} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {outros.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Arquivos</p>
                <div className="space-y-2">
                  {outros.map(f => (
                    <div key={f.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{f.nome}</p>
                        <p className="text-xs text-slate-500">{fmtBytes(f.tamanho)}</p>
                      </div>
                      <a
                        href={f.url}
                        download={f.nome}
                        className="p-2 rounded-xl bg-slate-700 text-slate-300 active:bg-slate-600"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── ABA LOG ────────────────────────────────────────────────── */}
        {aba === 'log' && (
          <>
            {item.log.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">Sem registros de log.</div>
            )}
            <div className="space-y-2">
              {item.log.map(l => (
                <div key={l.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-white font-medium">{l.acao}</p>
                    <p className="text-[10px] text-slate-500 flex-shrink-0">{fmtDatetime(l.timestamp)}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{l.ator}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Anexo" className="max-w-full max-h-full rounded-xl object-contain" />
          <button
            className="absolute top-10 right-5 p-2 bg-slate-800/80 rounded-full text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-slate-500 flex-shrink-0">{label}</p>
      <div className="text-sm text-white font-medium text-right">{value}</div>
    </div>
  )
}

// ─── Modal Nova Solicitação ──────────────────────────────────────────────────

interface NovaManutencaoForm {
  km: string
  motivo: Motivo | ''
  urgencia: Urgencia | ''
  descricao: string
  arquivos: File[]
}

function NovaManutencaoModal({
  kmAnterior,
  veiculoId,
  onClose,
  onSuccess,
}: {
  kmAnterior: number
  veiculoId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState<NovaManutencaoForm>({
    km: '', motivo: '', urgencia: '', descricao: '', arquivos: [],
  })
  const [errors, setErrors] = useState<Partial<Record<keyof NovaManutencaoForm | 'global', string>>>({})
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function validate() {
    const e: typeof errors = {}
    const kmNum = parseInt(form.km)
    if (!form.km || isNaN(kmNum))          e.km = 'Informe o KM atual.'
    else if (kmNum < kmAnterior)           e.km = `KM deve ser ≥ ${kmAnterior.toLocaleString('pt-BR')} km.`
    if (!form.motivo)                       e.motivo = 'Selecione o motivo.'
    if (!form.urgencia)                     e.urgencia = 'Selecione a urgência.'
    if (!form.descricao.trim())             e.descricao = 'Descrição é obrigatória.'
    if (form.descricao.length > 2000)       e.descricao = 'Máximo de 2000 caracteres.'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSending(true)
    try {
      const fd = new FormData()
      fd.append('veiculo_id', veiculoId)
      fd.append('km', form.km)
      fd.append('motivo', form.motivo)
      fd.append('urgencia', form.urgencia)
      fd.append('descricao', form.descricao)
      form.arquivos.forEach(f => fd.append('arquivos', f))
      const res = await fetch('/api/app/manutencao', { method: 'POST', body: fd })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErrors({ global: j.message ?? 'Erro ao enviar solicitação.' })
        return
      }
      onSuccess()
    } catch {
      setErrors({ global: 'Falha de conexão. Tente novamente.' })
    } finally {
      setSending(false)
    }
  }

  function addFiles(files: FileList | null) {
    if (!files) return
    const arr = Array.from(files)
    // Limite 100MB por arquivo
    const validos = arr.filter(f => f.size <= 100 * 1024 * 1024)
    const invalidos = arr.filter(f => f.size > 100 * 1024 * 1024)
    if (invalidos.length)
      setErrors(prev => ({ ...prev, arquivos: `${invalidos.length} arquivo(s) excedem 100 MB e foram ignorados.` }))
    setForm(prev => ({ ...prev, arquivos: [...prev.arquivos, ...validos] }))
  }

  function removeFile(idx: number) {
    setForm(prev => ({ ...prev, arquivos: prev.arquivos.filter((_, i) => i !== idx) }))
  }

  const inp = 'bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:border-blue-500 disabled:opacity-50'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-slate-800">
        <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 text-slate-300 active:bg-slate-700">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-white font-bold text-lg flex-1">Solicitar Manutenção</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Erro global */}
        {errors.global && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm flex gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {errors.global}
          </div>
        )}

        {/* KM Atual */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            KM Atual <span className="text-red-400">*</span>
            {kmAnterior > 0 && <span className="text-slate-500 ml-1">(mín. {kmAnterior.toLocaleString('pt-BR')} km)</span>}
          </label>
          <input
            type="number"
            min={kmAnterior}
            className={inp}
            placeholder="Ex: 125000"
            value={form.km}
            onChange={e => { setForm(p => ({ ...p, km: e.target.value })); setErrors(p => ({ ...p, km: undefined })) }}
          />
          {errors.km && <p className="text-red-400 text-xs mt-1">{errors.km}</p>}
        </div>

        {/* Motivo */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            Motivo <span className="text-red-400">*</span>
          </label>
          <select
            className={`${inp} appearance-none`}
            value={form.motivo}
            onChange={e => { setForm(p => ({ ...p, motivo: e.target.value as Motivo })); setErrors(p => ({ ...p, motivo: undefined })) }}
          >
            <option value="" disabled>Selecione...</option>
            {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.motivo && <p className="text-red-400 text-xs mt-1">{errors.motivo}</p>}
        </div>

        {/* Urgência */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            Urgência <span className="text-red-400">*</span>
          </label>
          <select
            className={`${inp} appearance-none`}
            value={form.urgencia}
            onChange={e => { setForm(p => ({ ...p, urgencia: e.target.value as Urgencia })); setErrors(p => ({ ...p, urgencia: undefined })) }}
          >
            <option value="" disabled>Selecione...</option>
            {URGENCIAS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
          {errors.urgencia && <p className="text-red-400 text-xs mt-1">{errors.urgencia}</p>}
        </div>

        {/* Descrição */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 flex justify-between">
            <span>Descrição do problema <span className="text-red-400">*</span></span>
            <span className={form.descricao.length > 2000 ? 'text-red-400' : 'text-slate-600'}>
              {form.descricao.length}/2000
            </span>
          </label>
          <textarea
            rows={4}
            className={`${inp} resize-none`}
            placeholder="Descreva o problema com detalhes..."
            value={form.descricao}
            onChange={e => { setForm(p => ({ ...p, descricao: e.target.value })); setErrors(p => ({ ...p, descricao: undefined })) }}
          />
          {errors.descricao && <p className="text-red-400 text-xs mt-1">{errors.descricao}</p>}
        </div>

        {/* Anexos */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Anexos (máx. 100 MB cada)</label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border border-dashed border-slate-600 rounded-xl py-3 text-slate-400 text-sm flex items-center justify-center gap-2 active:bg-slate-800/50"
          >
            <Paperclip className="w-4 h-4" />
            Adicionar arquivos
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => addFiles(e.target.files)}
          />
          {errors.arquivos && <p className="text-yellow-400 text-xs mt-1">{errors.arquivos}</p>}
          {form.arquivos.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {form.arquivos.map((f, i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
                  {f.type.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{f.name}</p>
                    <p className="text-[10px] text-slate-500">{fmtBytes(f.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="p-1 text-slate-500 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={sending}
          className="bg-blue-600 text-white rounded-xl py-3.5 font-semibold w-full flex items-center justify-center gap-2 disabled:opacity-60 active:bg-blue-700"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />}
          {sending ? 'Enviando...' : 'Enviar Solicitação'}
        </button>

        <div className="h-4" />
      </form>
    </div>
  )
}

// ─── Card de Manutenção ──────────────────────────────────────────────────────

function ManutencaoCard({ item, onClick }: { item: Manutencao; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-slate-800 rounded-2xl p-4 border border-slate-700 text-left active:bg-slate-700/80 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[10px] text-slate-500 font-mono">{item.id}</p>
        <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <StatusBadge status={item.status} />
        <UrgenciaBadge urgencia={item.urgencia} />
      </div>
      <p className="text-white font-semibold text-sm mb-0.5">{item.motivo}</p>
      <p className="text-slate-400 text-xs">{fmtDate(item.data_abertura)}</p>
    </button>
  )
}

// ─── Filtros ─────────────────────────────────────────────────────────────────

interface Filtros {
  status: StatusManutencao[]
  dataInicio: string
  dataFim: string
}

function FiltrosPanel({
  filtros,
  onChange,
}: {
  filtros: Filtros
  onChange: (f: Filtros) => void
}) {
  const [open, setOpen] = useState(false)

  function toggleStatus(s: StatusManutencao) {
    const has = filtros.status.includes(s)
    onChange({ ...filtros, status: has ? filtros.status.filter(x => x !== s) : [...filtros.status, s] })
  }

  const hasActive = filtros.status.length > 0 || filtros.dataInicio || filtros.dataFim

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-300"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
          {hasActive && <span className="w-2 h-2 rounded-full bg-blue-400" />}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700 pt-3">
          {/* Status chips */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_STATUS.map(s => {
                const active = filtros.status.includes(s)
                const b = STATUS_BADGE[s]
                return (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                      active ? b.cls : 'border-slate-600 text-slate-500'
                    }`}
                  >
                    {b.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Data início</label>
              <input
                type="date"
                className="bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2 text-xs w-full focus:outline-none focus:border-blue-500"
                value={filtros.dataInicio}
                onChange={e => onChange({ ...filtros, dataInicio: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Data fim</label>
              <input
                type="date"
                className="bg-slate-700 border border-slate-600 text-white rounded-xl px-3 py-2 text-xs w-full focus:outline-none focus:border-blue-500"
                value={filtros.dataFim}
                onChange={e => onChange({ ...filtros, dataFim: e.target.value })}
              />
            </div>
          </div>

          {hasActive && (
            <button
              onClick={() => onChange({ status: [], dataInicio: '', dataFim: '' })}
              className="text-xs text-blue-400 underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ManutencaoPage() {
  const [veiculoId, setVeiculoId]       = useState<string | null>(null)
  const [kmAnterior, setKmAnterior]     = useState(0)
  const [temAberta, setTemAberta]       = useState(false)
  const [manutencoes, setManutencoes]   = useState<Manutencao[]>([])
  const [loading, setLoading]           = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [hasMore, setHasMore]           = useState(true)
  const [page, setPage]                 = useState(1)
  const [filtros, setFiltros]           = useState<Filtros>({ status: [], dataInicio: '', dataFim: '' })
  const [showNova, setShowNova]         = useState(false)
  const [detalhe, setDetalhe]           = useState<Manutencao | null>(null)
  const [tooltip, setTooltip]           = useState(false)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Carregar perfil / veículo
  useEffect(() => {
    async function loadPerfil() {
      try {
        const res  = await fetch('/api/auth/profile')
        const json = await res.json()
        const profile = json.profile ?? json
        if (profile.veiculo_id) {
          setVeiculoId(profile.veiculo_id)
          const vRes  = await fetch(`/api/admin/veiculos?id=${profile.veiculo_id}`)
          const vJson = await vRes.json()
          if (vJson.veiculo?.km_atual) setKmAnterior(vJson.veiculo.km_atual)
        }
      } catch { /* offline */ }
    }
    loadPerfil()
  }, [])

  // Buscar manutenções
  const fetchManutencoes = useCallback(async (pg: number, replace = false) => {
    const params = new URLSearchParams({ page: String(pg), limit: String(PAGE_SIZE) })
    if (filtros.status.length) params.append('status', filtros.status.join(','))
    if (filtros.dataInicio)    params.append('data_inicio', filtros.dataInicio)
    if (filtros.dataFim)       params.append('data_fim', filtros.dataFim)

    try {
      const res  = await fetch(`/api/app/manutencao?${params}`)
      const json = await res.json()
      const lista: Manutencao[] = json.manutencoes ?? []
      setManutencoes(prev => replace ? lista : [...prev, ...lista])
      setHasMore(lista.length === PAGE_SIZE)

      // Verificar se há alguma manutenção em aberto
      const abertas: StatusManutencao[] = ['Aguardando Atendimento', 'Aguardando Manutenção', 'Em Manutenção']
      if (replace) {
        setTemAberta(lista.some(m => abertas.includes(m.status)))
      } else {
        setManutencoes(prev => {
          setTemAberta(prev.some(m => abertas.includes(m.status)))
          return prev
        })
      }
    } catch { /* offline */ } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filtros])

  // Recarrega ao mudar filtros
  useEffect(() => {
    setLoading(true)
    setPage(1)
    setManutencoes([])
    fetchManutencoes(1, true)
  }, [fetchManutencoes])

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        setLoadingMore(true)
        const next = page + 1
        setPage(next)
        fetchManutencoes(next, false)
      }
    }, { threshold: 0.1 })

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [hasMore, loadingMore, loading, page, fetchManutencoes])

  function handleNovaSuccess() {
    setShowNova(false)
    setLoading(true)
    setPage(1)
    setManutencoes([])
    fetchManutencoes(1, true)
  }

  // Motivo do botão desabilitado
  const btnDisabledReason = !veiculoId
    ? 'Nenhum veículo vinculado. Consulte seu gestor.'
    : temAberta
    ? 'Já existe uma manutenção em aberto para este veículo.'
    : null

  const btnDisabled = !!btnDisabledReason

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <Link href="/app/home" className="p-1.5 rounded-xl bg-slate-800 text-slate-300 active:bg-slate-700">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-xl flex-1">Manutenções</h1>
      </header>

      <div className="flex-1 px-5 space-y-3 pb-4">
        {/* Botão Solicitar */}
        <div className="relative">
          <button
            disabled={btnDisabled}
            onClick={() => !btnDisabled && setShowNova(true)}
            onMouseEnter={() => btnDisabled && setTooltip(true)}
            onMouseLeave={() => setTooltip(false)}
            onTouchStart={() => btnDisabled && setTooltip(true)}
            onTouchEnd={() => setTooltip(false)}
            className={`bg-blue-600 text-white rounded-xl py-3.5 font-semibold w-full flex items-center justify-center gap-2 transition-opacity ${
              btnDisabled ? 'opacity-50 cursor-not-allowed' : 'active:bg-blue-700'
            }`}
          >
            <Plus className="w-5 h-5" />
            Solicitar Manutenção
          </button>
          {tooltip && btnDisabledReason && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-slate-700 border border-slate-600 rounded-xl p-3 text-xs text-slate-200 shadow-xl z-10 text-center">
              {btnDisabledReason}
            </div>
          )}
        </div>

        {/* Filtros */}
        <FiltrosPanel filtros={filtros} onChange={f => setFiltros(f)} />

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 animate-pulse">
                <div className="h-3 w-32 bg-slate-700 rounded mb-3" />
                <div className="h-4 w-24 bg-slate-700 rounded mb-2" />
                <div className="h-3 w-20 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : manutencoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-slate-800 rounded-full p-5 mb-4 border border-slate-700">
              <Wrench className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Nenhuma manutenção registrada.</p>
            <p className="text-slate-500 text-xs mt-1">Use o botão acima para solicitar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {manutencoes.map(m => (
              <ManutencaoCard key={m.id} item={m} onClick={() => setDetalhe(m)} />
            ))}
          </div>
        )}

        {/* Sentinel para infinite scroll */}
        <div ref={sentinelRef} className="h-4" />

        {loadingMore && (
          <div className="flex justify-center py-3">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        )}

        {!hasMore && manutencoes.length > 0 && (
          <p className="text-center text-slate-600 text-xs py-2">Todas as manutenções carregadas.</p>
        )}
      </div>

      <BottomNav />

      {/* Modal Nova Solicitação */}
      {showNova && veiculoId && (
        <NovaManutencaoModal
          kmAnterior={kmAnterior}
          veiculoId={veiculoId}
          onClose={() => setShowNova(false)}
          onSuccess={handleNovaSuccess}
        />
      )}

      {/* Modal Detalhe */}
      {detalhe && (
        <DetalheModal item={detalhe} onClose={() => setDetalhe(null)} />
      )}
    </div>
  )
}
