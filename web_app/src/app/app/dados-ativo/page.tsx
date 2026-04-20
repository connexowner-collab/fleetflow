"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  FileText,
  RefreshCw,
  Truck,
} from 'lucide-react'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Veiculo {
  id: number
  placa: string
  marca: string
  modelo: string
  ano_fabricacao: number | null
  ano_modelo: number | null
  tipo: string | null
  combustivel: string | null
  cor: string | null
  renavam: string | null
  chassi: string | null
  filial: string | null
  status: string
  // documentação
  crlv_vencimento: string | null
  crlv_pdf_url: string | null
  seguro_vencimento: string | null
  seguro_pdf_url?: string | null
  licenciamento_vencimento: string | null
  licenciamento_pdf_url?: string | null
}

interface Checklist {
  id: number
  data_hora: string
  tipo: 'pre' | 'pos' | string
  status: string
  pdf_url: string | null
}

type Aba = 'cadastro' | 'documentacao' | 'historico'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function docStatus(vencimento: string | null): { label: string; color: string } | null {
  if (!vencimento) return null
  const diff = Math.floor(
    (new Date(vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (diff < 0)  return { label: 'Vencido',  color: 'bg-red-500/20 text-red-400 border border-red-500/30' }
  if (diff <= 30) return { label: 'Alerta',   color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' }
  return               { label: 'OK',        color: 'bg-green-500/20 text-green-400 border border-green-500/30' }
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function statusVeiculoBadge(status: string) {
  const map: Record<string, string> = {
    Ativo:           'bg-green-500/20 text-green-400 border border-green-500/30',
    'Em Manutenção': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    Inativo:         'bg-slate-600/40 text-slate-400 border border-slate-600/30',
    'Em Rota':       'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  }
  return map[status] ?? 'bg-slate-600/40 text-slate-400 border border-slate-600/30'
}

function checklistTipo(tipo: string) {
  if (tipo === 'pre') return 'Pré-Operacional'
  if (tipo === 'pos') return 'Pós-Operacional'
  return tipo
}

function checklistStatusBadge(status: string) {
  const map: Record<string, string> = {
    aprovado:   'bg-green-500/20 text-green-400 border border-green-500/30',
    reprovado:  'bg-red-500/20 text-red-400 border border-red-500/30',
    pendente:   'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  }
  return map[status.toLowerCase()] ?? 'bg-slate-600/40 text-slate-400 border border-slate-600/30'
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-700/60 rounded animate-pulse ${className}`} />
}

function CadastroSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-5 w-36" />
        </div>
      ))}
    </div>
  )
}

function DocSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

function HistoricoSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

// ─── Campo helper ─────────────────────────────────────────────────────────────

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <div className="text-white font-medium">{children}</div>
    </div>
  )
}

// ─── Abas ────────────────────────────────────────────────────────────────────

function AbaCadastro({ veiculo }: { veiculo: Veiculo }) {
  return (
    <div className="space-y-3">
      {/* Placa em destaque */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Placa</p>
        <p className="text-white font-bold text-3xl tracking-widest">{veiculo.placa}</p>
      </div>

      <Campo label="Marca">{veiculo.marca || '—'}</Campo>
      <Campo label="Modelo">{veiculo.modelo || '—'}</Campo>
      <Campo label="Ano de Fabricação">{veiculo.ano_fabricacao ?? '—'}</Campo>
      <Campo label="Ano do Modelo">{veiculo.ano_modelo ?? '—'}</Campo>
      <Campo label="Tipo">{veiculo.tipo || '—'}</Campo>
      <Campo label="Combustível">{veiculo.combustivel || '—'}</Campo>
      <Campo label="Cor">{veiculo.cor || '—'}</Campo>
      <Campo label="RENAVAM">{veiculo.renavam || '—'}</Campo>
      <Campo label="Chassi">{veiculo.chassi || '—'}</Campo>
      <Campo label="Filial">{veiculo.filial || '—'}</Campo>

      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Status</p>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusVeiculoBadge(veiculo.status)}`}>
          {veiculo.status}
        </span>
      </div>
    </div>
  )
}

function AbaDocumentacao({ veiculo }: { veiculo: Veiculo }) {
  const docs = [
    {
      nome: 'CRLV',
      vencimento: veiculo.crlv_vencimento,
      pdf_url: veiculo.crlv_pdf_url,
    },
    {
      nome: 'Seguro',
      vencimento: veiculo.seguro_vencimento,
      pdf_url: veiculo.seguro_pdf_url ?? null,
    },
    {
      nome: 'Licenciamento',
      vencimento: veiculo.licenciamento_vencimento,
      pdf_url: veiculo.licenciamento_pdf_url ?? null,
    },
  ]

  return (
    <div className="space-y-3">
      {docs.map(doc => {
        const status = docStatus(doc.vencimento)
        return (
          <div key={doc.nome} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600/20 p-2 rounded-xl">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{doc.nome}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Vencimento:{' '}
                    <span className="text-slate-300">{fmtDate(doc.vencimento)}</span>
                  </p>
                </div>
              </div>
              {status && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                  {status.label}
                </span>
              )}
            </div>

            {doc.pdf_url ? (
              <a
                href={doc.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 transition text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                <FileText className="w-3.5 h-3.5" />
                Baixar PDF
              </a>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-1.5 bg-slate-700/60 text-slate-500 text-xs font-semibold px-4 py-2 rounded-xl cursor-not-allowed"
              >
                <FileText className="w-3.5 h-3.5" />
                Baixar PDF
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AbaHistorico({
  checklists,
  loadingMore,
  hasMore,
  onLoadMore,
}: {
  checklists: Checklist[]
  loadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
}) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore || loadingMore) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) onLoadMore()
      },
      { threshold: 0.1 }
    )
    const el = sentinelRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [hasMore, loadingMore, onLoadMore])

  if (!loadingMore && checklists.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm font-medium">Nenhum checklist realizado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {checklists.map(c => (
        <div key={c.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">#{c.id}</p>
              <p className="text-white font-medium text-sm mt-0.5">{fmtDateTime(c.data_hora)}</p>
              <p className="text-slate-400 text-xs mt-0.5">{checklistTipo(c.tipo)}</p>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${checklistStatusBadge(c.status)}`}>
              {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
            </span>
          </div>

          {c.pdf_url ? (
            <a
              href={c.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 transition text-white text-xs font-semibold px-3 py-1.5 rounded-xl mt-1"
            >
              <FileText className="w-3 h-3" />
              Ver PDF
            </a>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-1.5 bg-slate-700/60 text-slate-500 text-xs font-semibold px-3 py-1.5 rounded-xl mt-1 cursor-not-allowed"
            >
              <FileText className="w-3 h-3" />
              Ver PDF
            </button>
          )}
        </div>
      ))}

      {/* sentinel para infinite scroll */}
      <div ref={sentinelRef} />

      {loadingMore && (
        <div className="space-y-3">
          <HistoricoSkeleton />
        </div>
      )}

      {!hasMore && checklists.length > 0 && (
        <p className="text-center text-slate-600 text-xs py-4">Fim do histórico</p>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function DadosAtivoPage() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('cadastro')

  // Veículo
  const [veiculo, setVeiculo]         = useState<Veiculo | null>(null)
  const [semVeiculo, setSemVeiculo]   = useState(false)
  const [loadingVeiculo, setLoadingVeiculo] = useState(true)

  // Histórico
  const [checklists, setChecklists]   = useState<Checklist[]>([])
  const [loadingCk, setLoadingCk]     = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [ckPage, setCkPage]           = useState(1)
  const [hasMore, setHasMore]         = useState(true)
  const [ckLoaded, setCkLoaded]       = useState(false)

  // Refresh manual
  const [refreshing, setRefreshing]   = useState(false)

  // ── Carrega veículo ────────────────────────────────────────────────────────
  const carregarVeiculo = useCallback(async (silent = false) => {
    if (!silent) setLoadingVeiculo(true)
    try {
      const res  = await fetch('/api/app/veiculo')
      if (res.status === 404 || res.status === 204) {
        setSemVeiculo(true)
        setVeiculo(null)
        return
      }
      const json = await res.json()
      if (!json || (!json.id && !json.veiculo)) {
        setSemVeiculo(true)
        setVeiculo(null)
        return
      }
      const v: Veiculo = json.veiculo ?? json
      setVeiculo(v)
      setSemVeiculo(false)
    } catch {
      // offline ou erro — mantém estado anterior
    } finally {
      if (!silent) setLoadingVeiculo(false)
    }
  }, [])

  // ── Carrega checklists (página) ────────────────────────────────────────────
  const carregarChecklists = useCallback(async (page: number, append = false) => {
    if (append) setLoadingMore(true)
    else setLoadingCk(true)
    try {
      const res  = await fetch(`/api/app/checklist?page=${page}&limit=${PAGE_SIZE}`)
      const json = await res.json()
      const lista: Checklist[] = json.checklists ?? json.data ?? json ?? []
      setChecklists(prev => append ? [...prev, ...lista] : lista)
      setHasMore(lista.length === PAGE_SIZE)
    } catch {
      setHasMore(false)
    } finally {
      if (append) setLoadingMore(false)
      else { setLoadingCk(false); setCkLoaded(true) }
    }
  }, [])

  // ── Refresh manual ────────────────────────────────────────────────────────
  async function handleRefresh() {
    setRefreshing(true)
    await carregarVeiculo(true)
    if (abaAtiva === 'historico') {
      setCkPage(1)
      await carregarChecklists(1, false)
    }
    setRefreshing(false)
  }

  // ── Infinite scroll callback ──────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    const nextPage = ckPage + 1
    setCkPage(nextPage)
    carregarChecklists(nextPage, true)
  }, [ckPage, carregarChecklists])

  // ── Efeito inicial + polling 5 min ────────────────────────────────────────
  useEffect(() => {
    carregarVeiculo()
    const interval = setInterval(() => carregarVeiculo(true), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [carregarVeiculo])

  // ── Carrega histórico ao entrar na aba ────────────────────────────────────
  useEffect(() => {
    if (abaAtiva === 'historico' && !ckLoaded) {
      carregarChecklists(1, false)
    }
  }, [abaAtiva, ckLoaded, carregarChecklists])

  // ── Polling histórico ─────────────────────────────────────────────────────
  useEffect(() => {
    if (abaAtiva !== 'historico') return
    const interval = setInterval(() => carregarChecklists(1, false), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [abaAtiva, carregarChecklists])

  // ─── Render ────────────────────────────────────────────────────────────────

  const abas: { key: Aba; label: string }[] = [
    { key: 'cadastro',    label: 'Dados Cadastrais' },
    { key: 'documentacao',label: 'Documentação' },
    { key: 'historico',   label: 'Histórico' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 max-w-md mx-auto">

      {/* Header sticky */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 pt-10 pb-0">
        <div className="flex items-center justify-between mb-3">
          <Link
            href="/app/home"
            className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>

          <h1 className="text-white font-bold text-base">Dados do Ativo</h1>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Atualizar"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Abas */}
        <div className="flex">
          {abas.map(aba => (
            <button
              key={aba.key}
              onClick={() => setAbaAtiva(aba.key)}
              className={`flex-1 pb-2.5 text-xs font-semibold transition-colors border-b-2 ${
                abaAtiva === aba.key
                  ? 'text-white border-blue-500'
                  : 'text-slate-500 border-transparent'
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 px-4 py-4 pb-6">

        {/* Estado sem veículo vinculado */}
        {!loadingVeiculo && semVeiculo && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 mb-4">
              <Truck className="w-12 h-12 text-slate-600" />
            </div>
            <p className="text-white font-semibold mb-1">Nenhum veículo vinculado</p>
            <p className="text-slate-400 text-sm">Consulte seu gestor para vincular um veículo.</p>
          </div>
        )}

        {/* Aba: Dados Cadastrais */}
        {abaAtiva === 'cadastro' && !semVeiculo && (
          loadingVeiculo
            ? <CadastroSkeleton />
            : veiculo
              ? <AbaCadastro veiculo={veiculo} />
              : null
        )}

        {/* Aba: Documentação */}
        {abaAtiva === 'documentacao' && !semVeiculo && (
          loadingVeiculo
            ? <DocSkeleton />
            : veiculo
              ? <AbaDocumentacao veiculo={veiculo} />
              : null
        )}

        {/* Aba: Histórico */}
        {abaAtiva === 'historico' && !semVeiculo && (
          loadingCk
            ? <HistoricoSkeleton />
            : (
              <AbaHistorico
                checklists={checklists}
                loadingMore={loadingMore}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
              />
            )
        )}
      </main>

      <BottomNav />
    </div>
  )
}
