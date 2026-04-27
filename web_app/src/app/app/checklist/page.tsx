"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, ClipboardCheck, Plus, FileText,
  AlertTriangle, CheckCircle2, Camera, Trash2, X, Loader2,
  Car, Bell, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

interface ChecklistItem {
  id: string; data_hora: string; tipo: 'pre' | 'pos'
  status: string; km?: string | number; pdf_url?: string | null
}
interface Ativo { placa: string; chassi: string; modelo: string; marca: string; km_atual: number }
interface Profile { nome: string; email: string; veiculo_id?: string }
interface Avaria { descricao: string; tipo: string; gravidade: string; foto: File | null; fotoPreview: string }
interface Opcao { valor: string }

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

function validarCPF(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += +d[i] * (10 - i)
  let r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  if (r !== +d[9]) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += +d[i] * (11 - i)
  r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  return r === +d[10]
}

const INSPECAO_ITENS_DEFAULT = [
  'Pneus', 'Óleo', 'Arrefecimento', 'Lâmpadas',
  'Estepe / triângulo / macaco', 'Cartão combustível',
]

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  Aprovado:         { label: 'Aprovado',        cls: 'bg-green-100 text-green-700'    },
  'Com Pendências': { label: 'Com Pendências',  cls: 'bg-yellow-100 text-yellow-700'  },
  Validado:         { label: 'Validado',        cls: 'bg-emerald-100 text-emerald-700'},
  Recusado:         { label: 'Recusado',        cls: 'bg-red-100 text-red-700'        },
  Pendente:         { label: 'Pendente',        cls: 'bg-gray-100 text-gray-600'      },
}

const MAX_FOTO_MB = 10

function ProgressBar({ etapa, total = 6 }: { etapa: number; total?: number }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-1">
      <div className="h-1 rounded-full transition-all duration-500"
           style={{ width: `${(etapa / total) * 100}%`, background: 'linear-gradient(90deg,#4B3FE4,#7C3AED)' }} />
    </div>
  )
}

function SignatureCanvas({ onChange }: { onChange: (data: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    drawing.current = true
  }

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.lineWidth = 2; ctx.strokeStyle = '#4B3FE4'; ctx.lineCap = 'round'
    ctx.lineTo(pos.x, pos.y); ctx.stroke()
    onChange(canvas.toDataURL())
  }

  const stop = () => { drawing.current = false }

  const clear = () => {
    const canvas = ref.current; if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    onChange('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assinatura *</span>
        <button type="button" onClick={clear} className="text-xs text-red-500 flex items-center gap-1 font-medium">
          <Trash2 className="w-3 h-3" /> Limpar
        </button>
      </div>
      <canvas
        ref={ref} width={340} height={140}
        className="w-full bg-white border-2 border-dashed border-gray-300 rounded-2xl touch-none"
        onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
      />
      <p className="text-gray-400 text-[11px] mt-1 text-center">Assine com o dedo ou mouse</p>
    </div>
  )
}

export default function ChecklistPage() {
  const [profile,      setProfile]      = useState<Profile | null>(null)
  const [ativo,        setAtivo]        = useState<Ativo | null>(null)
  const [historico,    setHistorico]    = useState<ChecklistItem[]>([])
  const [loadingList,  setLoadingList]  = useState(true)
  const [loadingMore,  setLoadingMore]  = useState(false)
  const [hasMore,      setHasMore]      = useState(true)
  const [page,         setPage]         = useState(1)

  // Config options loaded from API
  const [itensInspecao,    setItensInspecao]    = useState<string[]>(INSPECAO_ITENS_DEFAULT)
  const [tiposChecklist,   setTiposChecklist]   = useState<Opcao[]>([])
  const [unidades,         setUnidades]         = useState<Opcao[]>([])
  const [setores,          setSetores]          = useState<Opcao[]>([])
  const [areas,            setAreas]            = useState<Opcao[]>([])
  const [tiposAvaria,      setTiposAvaria]      = useState<Opcao[]>([])
  const [gravidadesAvaria, setGravidadesAvaria] = useState<Opcao[]>([])

  const [emFluxo,      setEmFluxo]      = useState(false)
  const [etapa,        setEtapa]        = useState(1)
  const [enviando,     setEnviando]     = useState(false)
  const [checklistId,  setChecklistId]  = useState<string | null>(null)
  const [showAbandon,  setShowAbandon]  = useState(false)
  // Pop-up obrigatório de avaria (D-06)
  const [showPopupAvaria, setShowPopupAvaria] = useState(false)

  // Etapa 1: veículo (somente leitura)
  // Etapa 2: dados do motorista
  const [tipoChecklist, setTipoChecklist] = useState('')
  const [unidade,       setUnidade]       = useState('')
  const [setor,         setSetor]         = useState('')
  const [area,          setArea]          = useState('')

  // Etapa 3: inspeção + KM
  const [kmAtual,  setKmAtual]  = useState('')
  const [kmErro,   setKmErro]   = useState('')
  const [inspecao, setInspecao] = useState<Record<string, 'ok' | 'avaria'>>({})
  const [observacao, setObservacao] = useState('')

  // Etapa 4: fotos
  const [fotoFrente,        setFotoFrente]        = useState<File | null>(null)
  const [fotoFrentePreview, setFotoFrentePreview] = useState('')
  const [fotoTras,          setFotoTras]          = useState<File | null>(null)
  const [fotoTrasPreview,   setFotoTrasPreview]   = useState('')
  const [fotoEsq,           setFotoEsq]           = useState<File | null>(null)
  const [fotoEsqPreview,    setFotoEsqPreview]    = useState('')
  const [fotoDir,           setFotoDir]           = useState<File | null>(null)
  const [fotoDirPreview,    setFotoDirPreview]    = useState('')
  const [fotoErro,          setFotoErro]          = useState('')

  // Etapa 5: avarias
  const [avarias, setAvarias] = useState<Avaria[]>([])

  // Etapa 6: assinatura
  const [assinatura,  setAssinatura]  = useState('')
  const [cpf,         setCpf]         = useState('')
  const [cpfErro,     setCpfErro]     = useState('')
  const [emailEnvio,  setEmailEnvio]  = useState('')

  const loadList = useCallback(async (p = 1, replace = false) => {
    try {
      const res  = await fetch(`/api/app/checklist?page=${p}&limit=20`)
      const json = await res.json()
      const items = (json.checklists ?? json.data ?? []).map((c: Record<string, unknown>) => ({
        id:       c.codigo ?? c.id,
        data_hora: c.created_at,
        tipo:     (c.tipo_checklist as string)?.includes('Pós') ? 'pos' : 'pre',
        status:   String(c.status ?? 'Pendente'),
        km:       c.km_atual,
        pdf_url:  (c.pdf_url as string | null) ?? null,
      }))
      setHistorico(prev => replace ? items : [...prev, ...items])
      setHasMore(items.length === 20)
      setPage(p)
    } catch { /* offline */ }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const [profRes, itensRes, tiposRes, unidadesRes, setoresRes, areasRes, tiposAvariaRes, gravidadesRes] = await Promise.all([
          fetch('/api/auth/profile'),
          fetch('/api/app/config-opcoes?tipo=item_inspecao'),
          fetch('/api/app/config-opcoes?tipo=tipo_checklist'),
          fetch('/api/app/config-opcoes?tipo=unidade'),
          fetch('/api/app/config-opcoes?tipo=setor'),
          fetch('/api/app/config-opcoes?tipo=area'),
          fetch('/api/app/config-opcoes?tipo=tipo_avaria'),
          fetch('/api/app/config-opcoes?tipo=gravidade_avaria'),
        ])
        const profJson = await profRes.json()
        const p: Profile = profJson.profile ?? profJson
        setProfile(p)
        setEmailEnvio(p.email ?? '')

        const itensAPI: string[] = ((await itensRes.json()).opcoes ?? []).map((o: Opcao) => o.valor)
        if (itensAPI.length > 0) {
          setItensInspecao(itensAPI)
          setInspecao(Object.fromEntries(itensAPI.map(k => [k, 'ok' as const])))
        } else {
          setInspecao(Object.fromEntries(INSPECAO_ITENS_DEFAULT.map(k => [k, 'ok' as const])))
        }

        const tiposAPI: Opcao[] = (await tiposRes.json()).opcoes ?? []
        setTiposChecklist(tiposAPI)
        if (tiposAPI.length > 0) setTipoChecklist(tiposAPI[0].valor)

        setUnidades((await unidadesRes.json()).opcoes ?? [])
        setSetores((await setoresRes.json()).opcoes ?? [])
        setAreas((await areasRes.json()).opcoes ?? [])
        setTiposAvaria((await tiposAvariaRes.json()).opcoes ?? [])
        setGravidadesAvaria((await gravidadesRes.json()).opcoes ?? [])

        if (p.veiculo_id) {
          const vRes  = await fetch('/api/app/veiculo')
          const vJson = await vRes.json()
          if (vJson.veiculo) setAtivo(vJson.veiculo)
        }
      } catch { /* offline */ }
      await loadList(1, true)
      setLoadingList(false)
    }
    init()
  }, [loadList])

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver(async ([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true)
        await loadList(page + 1)
        setLoadingMore(false)
      }
    }, { threshold: 0.5 })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, page, loadList])

  function iniciar() {
    if (!ativo) return
    setEtapa(1); setEmFluxo(true); setChecklistId(null); setShowPopupAvaria(false)
    setTipoChecklist(tiposChecklist[0]?.valor ?? '')
    setUnidade(''); setSetor(''); setArea('')
    setKmAtual(''); setKmErro('')
    setFotoFrente(null); setFotoFrentePreview('')
    setFotoTras(null); setFotoTrasPreview('')
    setFotoEsq(null); setFotoEsqPreview('')
    setFotoDir(null); setFotoDirPreview('')
    setFotoErro('')
    setInspecao(Object.fromEntries(itensInspecao.map(k => [k, 'ok' as const])))
    setObservacao(''); setAvarias([]); setAssinatura(''); setCpf(''); setCpfErro('')
  }

  function tryVoltar() {
    if (etapa === 1) { setShowAbandon(true); return }
    setEtapa(e => e - 1)
  }

  function validarFoto(file: File): string {
    if (file.size > MAX_FOTO_MB * 1024 * 1024)
      return `Foto "${file.name}" excede ${MAX_FOTO_MB}MB. Reduza o tamanho e tente novamente.`
    return ''
  }

  function avancar() {
    // Etapa 1: identificação — sem validação (somente leitura)
    if (etapa === 2) {
      if (!tipoChecklist) return
    }
    if (etapa === 3) {
      const kmA = ativo?.km_atual ?? 0
      if (!kmAtual || +kmAtual < kmA) { setKmErro(`KM atual deve ser ≥ ${kmA.toLocaleString('pt-BR')}`); return }
      setKmErro('')
    }
    if (etapa === 4) {
      if (!fotoFrente || !fotoTras) return
      setFotoErro('')
      // Pop-up obrigatório de avaria (D-06)
      setShowPopupAvaria(true)
      return
    }
    if (etapa < 6) setEtapa(e => e + 1)
  }

  function responderPopupAvaria(temAvaria: boolean) {
    setShowPopupAvaria(false)
    if (temAvaria) {
      setEtapa(5) // vai para tela de avarias
    } else {
      setAvarias([])
      setEtapa(6) // pula direto para assinatura
    }
  }

  function fileToPreview(file: File, setter: (s: string) => void) {
    const r = new FileReader()
    r.onload = e => setter(e.target?.result as string)
    r.readAsDataURL(file)
  }

  function handleFoto(file: File, setFile: (f: File) => void, setPreview: (s: string) => void) {
    const err = validarFoto(file)
    if (err) { setFotoErro(err); return }
    setFotoErro('')
    setFile(file)
    fileToPreview(file, setPreview)
  }

  function adicionarAvaria() {
    setAvarias(prev => [...prev, { descricao: '', tipo: '', gravidade: '', foto: null, fotoPreview: '' }])
  }

  function atualizarAvaria(idx: number, field: keyof Avaria, value: string | File | null) {
    setAvarias(prev => {
      const next = [...prev]
      if (field === 'foto' && value instanceof File) {
        const err = validarFoto(value)
        if (err) { setFotoErro(err); return prev }
        setFotoErro('')
        fileToPreview(value, preview => {
          setAvarias(p => { const n = [...p]; n[idx] = { ...n[idx], foto: value, fotoPreview: preview }; return n })
        })
        next[idx] = { ...next[idx], foto: value }
      } else {
        next[idx] = { ...next[idx], [field]: value }
      }
      return next
    })
  }

  function avariasSemFoto(): boolean {
    return avarias.some(a => !a.foto)
  }

  async function enviar() {
    if (!validarCPF(cpf)) { setCpfErro('CPF inválido'); return }
    setCpfErro('')
    if (!assinatura) return
    setEnviando(true)
    try {
      const form = new FormData()
      form.append('tipo_checklist', tipoChecklist)
      form.append('unidade',       unidade)
      form.append('setor',         setor)
      form.append('area',          area)
      form.append('km_atual',      kmAtual)
      form.append('inspecao',      JSON.stringify(inspecao))
      form.append('observacao',    observacao)
      form.append('cpf',           cpf)
      form.append('email_envio',   emailEnvio)
      form.append('assinatura',    assinatura)
      form.append('tem_avaria',    String(avarias.length > 0))
      if (fotoFrente) form.append('foto_frente',       fotoFrente)
      if (fotoTras)   form.append('foto_tras',         fotoTras)
      if (fotoEsq)    form.append('foto_lateral_esq',  fotoEsq)
      if (fotoDir)    form.append('foto_lateral_dir',  fotoDir)
      avarias.forEach((a, i) => {
        form.append(`avaria_${i}_descricao`, a.descricao)
        form.append(`avaria_${i}_tipo`,      a.tipo)
        form.append(`avaria_${i}_gravidade`, a.gravidade)
        if (a.foto) form.append(`avaria_${i}_foto`, a.foto)
      })
      const res  = await fetch('/api/app/checklist', { method: 'POST', body: form })
      const json = await res.json()
      setChecklistId(json.codigo ?? json.id ?? 'CHK-OK')
      setEtapa(7) // tela de sucesso
      await loadList(1, true)
    } catch { alert('Erro ao enviar. Tente novamente.') }
    finally { setEnviando(false) }
  }

  const now = new Date()
  const dataHoje  = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const horaAgora = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const FOTOS_SLOTS = [
    { label: 'Frente *',   obrig: true,  preview: fotoFrentePreview, setter: (f: File) => handleFoto(f, setFotoFrente, setFotoFrentePreview) },
    { label: 'Traseira *', obrig: true,  preview: fotoTrasPreview,   setter: (f: File) => handleFoto(f, setFotoTras, setFotoTrasPreview)     },
    { label: 'Lat. Esq',   obrig: false, preview: fotoEsqPreview,    setter: (f: File) => handleFoto(f, setFotoEsq, setFotoEsqPreview)       },
    { label: 'Lat. Dir',   obrig: false, preview: fotoDirPreview,    setter: (f: File) => handleFoto(f, setFotoDir, setFotoDirPreview)       },
  ]

  // ─── Render fluxo ───────────────────────────────────────────────────────────

  if (emFluxo) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#F4F6FB]">

        {/* Modal abandonar */}
        {showAbandon && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-gray-900 font-bold text-lg mb-2">Abandonar Checklist?</h3>
              <p className="text-gray-500 text-sm mb-6">As informações preenchidas serão perdidas.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowAbandon(false)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm">
                  Continuar
                </button>
                <button onClick={() => { setShowAbandon(false); setEmFluxo(false) }}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm">
                  Abandonar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pop-up obrigatório de avaria (D-06) */}
        {showPopupAvaria && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-gray-900 font-bold text-lg mb-2">O ativo tem avaria?</h3>
              <p className="text-gray-500 text-sm mb-6">Registre qualquer dano, defeito ou irregularidade encontrada.</p>
              <div className="flex gap-3">
                <button onClick={() => responderPopupAvaria(false)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm">
                  NÃO
                </button>
                <button onClick={() => responderPopupAvaria(true)}
                  className="flex-1 py-3 rounded-2xl bg-yellow-500 text-white font-semibold text-sm">
                  SIM — Registrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sucesso (etapa 7) */}
        {etapa === 7 && (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-gray-900 text-2xl font-bold mb-2">Checklist Enviado!</h2>
            <p className="text-gray-500 text-sm mb-5">Seu checklist foi registrado com sucesso.</p>
            <div className="bg-white rounded-2xl px-6 py-4 mb-8 shadow-sm border border-gray-100 w-full">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Protocolo</p>
              <p className="font-bold text-xl tracking-widest text-indigo-600">{checklistId}</p>
            </div>
            <button onClick={() => { setEmFluxo(false); setEtapa(1) }}
              className="w-full text-white font-bold rounded-2xl py-4 text-sm"
              style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
              Voltar ao Histórico
            </button>
          </div>
        )}

        {etapa < 7 && (
          <>
            {/* Header */}
            <div className="bg-white px-5 pt-12 pb-4 shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <button onClick={tryVoltar} className="p-1.5 bg-gray-100 rounded-xl">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                       style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
                    <Car className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">FleetFlow</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Checklist Diário</h1>
              <p className="text-gray-500 text-sm mt-0.5">Etapa {etapa} de 6</p>
              <div className="mt-3">
                <ProgressBar etapa={etapa} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8 space-y-4">

              {/* ── Etapa 1: Identificação do Veículo ── */}
              {etapa === 1 && ativo && (
                <>
                  <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="relative h-28"
                         style={{ background: 'linear-gradient(135deg,#4B3FE4 0%,#7C3AED 60%,#A78BFA 100%)' }}>
                      <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <Car className="w-24 h-24 text-white" />
                      </div>
                      <div className="absolute bottom-3 left-4">
                        <span className="bg-green-400 text-green-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mb-1">
                          <CheckCircle2 className="w-3 h-3" /> ATIVO
                        </span>
                        <p className="text-white font-bold">{ativo.marca} {ativo.modelo}</p>
                        <p className="text-white/80 text-sm tracking-widest">{ativo.placa}</p>
                      </div>
                    </div>
                    <div className="bg-white px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</p>
                        <p className="text-gray-900 font-semibold text-sm capitalize">{dataHoje}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hora</p>
                        <p className="text-gray-900 font-semibold text-sm">{horaAgora}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5 pt-4 pb-2">Dados do Veículo</p>
                    {[
                      { label: 'Placa',   value: ativo.placa   },
                      { label: 'Chassi',  value: ativo.chassi  },
                      { label: 'Modelo',  value: `${ativo.marca} ${ativo.modelo}` },
                      { label: 'KM Atual',value: `${ativo.km_atual?.toLocaleString('pt-BR')} km` },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
                        <span className="text-gray-500 text-sm">{row.label}</span>
                        <span className="text-gray-900 font-bold text-sm">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── Etapa 2: Dados do Motorista ── */}
              {etapa === 2 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dados do Motorista</p>

                  {/* Nome (somente leitura) */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Motorista</label>
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-semibold">
                      {profile?.nome ?? '—'}
                    </div>
                  </div>

                  {/* Tipo do Checklist */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Tipo do Checklist *</label>
                    {tiposChecklist.length > 0 ? (
                      <select value={tipoChecklist} onChange={e => setTipoChecklist(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500">
                        <option value="">Selecione...</option>
                        {tiposChecklist.map(o => <option key={o.valor} value={o.valor}>{o.valor}</option>)}
                      </select>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'Pré-operação', icon: '🌅' },
                          { value: 'Pós-operação', icon: '🌆' },
                        ].map(t => (
                          <button key={t.value}
                            onClick={() => setTipoChecklist(t.value)}
                            className={`py-4 rounded-2xl border-2 text-sm font-bold transition-colors flex flex-col items-center gap-1 ${
                              tipoChecklist === t.value
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 bg-white text-gray-500'
                            }`}>
                            <span className="text-xl">{t.icon}</span>
                            {t.value}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Unidade */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Unidade</label>
                    <select value={unidade} onChange={e => setUnidade(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500">
                      <option value="">Selecione...</option>
                      {unidades.map(o => <option key={o.valor} value={o.valor}>{o.valor}</option>)}
                    </select>
                  </div>

                  {/* Setor */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Setor</label>
                    <select value={setor} onChange={e => setSetor(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500">
                      <option value="">Selecione...</option>
                      {setores.map(o => <option key={o.valor} value={o.valor}>{o.valor}</option>)}
                    </select>
                  </div>

                  {/* Área */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Área</label>
                    <select value={area} onChange={e => setArea(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500">
                      <option value="">Selecione...</option>
                      {areas.map(o => <option key={o.valor} value={o.valor}>{o.valor}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* ── Etapa 3: Inspeção Técnica ── */}
              {etapa === 3 && (
                <>
                  {/* KM */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">KM Atual *</p>
                      <span className="text-xs text-gray-400">Anterior: {ativo?.km_atual?.toLocaleString('pt-BR')} km</span>
                    </div>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={kmAtual}
                      onChange={e => { setKmAtual(e.target.value); setKmErro('') }}
                      placeholder="Ex: 50000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    {kmErro && <p className="text-red-500 text-xs mt-1.5">{kmErro}</p>}
                  </div>

                  {/* Itens de inspeção */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5 pt-4 pb-2">Itens de Inspeção *</p>
                    {itensInspecao.map((item, i) => (
                      <div key={item} className={`flex items-center justify-between px-5 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                        <span className="text-gray-800 text-sm font-medium">{item}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setInspecao(prev => ({ ...prev, [item]: 'ok' }))}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${inspecao[item] === 'ok' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            OK
                          </button>
                          <button
                            onClick={() => setInspecao(prev => ({ ...prev, [item]: 'avaria' }))}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${inspecao[item] === 'avaria' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            N/C
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Observações */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                      Observações <span className="normal-case text-gray-300">(opcional)</span>
                    </label>
                    <textarea
                      value={observacao}
                      onChange={e => setObservacao(e.target.value.slice(0, 2000))}
                      rows={3}
                      placeholder="Descreva observações relevantes..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-gray-300 text-xs text-right mt-1">{observacao.length}/2000</p>
                  </div>
                </>
              )}

              {/* ── Etapa 4: Evidência Fotográfica ── */}
              {etapa === 4 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Evidência Fotográfica</p>
                  <p className="text-gray-500 text-xs mb-4">Frente e Traseira obrigatórias. Máx {MAX_FOTO_MB}MB por foto.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {FOTOS_SLOTS.map(slot => (
                      <label key={slot.label} className="cursor-pointer active:opacity-80">
                        <input type="file" accept="image/*" capture="environment" className="sr-only"
                          onChange={e => { const f = e.target.files?.[0]; if (f) slot.setter(f) }} />
                        <div className={`aspect-square rounded-2xl overflow-hidden border-2 flex items-center justify-center ${
                          slot.preview ? 'border-indigo-300' : slot.obrig ? 'border-dashed border-red-200' : 'border-dashed border-gray-300'
                        }`}>
                          {slot.preview ? (
                            <img src={slot.preview} alt={slot.label} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                              <Camera className="w-8 h-8" />
                              <span className="text-xs font-medium">{slot.label}</span>
                            </div>
                          )}
                        </div>
                        <p className={`text-center text-[10px] mt-1 font-medium ${slot.preview ? 'text-indigo-600' : slot.obrig ? 'text-red-400' : 'text-gray-400'}`}>
                          {slot.label}
                        </p>
                      </label>
                    ))}
                  </div>
                  {fotoErro && <p className="text-red-500 text-xs mt-3 text-center">{fotoErro}</p>}
                  {(!fotoFrente || !fotoTras) && !fotoErro && (
                    <p className="text-red-400 text-xs text-center mt-3">Fotos Frente e Traseira são obrigatórias.</p>
                  )}
                </div>
              )}

              {/* ── Etapa 5: Avaria ── */}
              {etapa === 5 && (
                <>
                  {fotoErro && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl">{fotoErro}</p>}
                  {avarias.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                      <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className="text-gray-800 font-semibold">Nenhuma avaria adicionada</p>
                      <p className="text-gray-400 text-sm mt-1">Adicione as avarias encontradas.</p>
                    </div>
                  ) : (
                    avarias.map((av, i) => (
                      <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-gray-900 font-semibold text-sm">Avaria {i + 1}</p>
                          <button onClick={() => setAvarias(prev => prev.filter((_, j) => j !== i))}
                            className="p-1.5 bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                        <textarea
                          value={av.descricao}
                          onChange={e => atualizarAvaria(i, 'descricao', e.target.value)}
                          rows={3}
                          placeholder="Descrição da avaria..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none focus:border-indigo-500"
                        />
                        {/* Tipo da avaria */}
                        <select value={av.tipo} onChange={e => atualizarAvaria(i, 'tipo', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500">
                          <option value="">Tipo da avaria *</option>
                          {tiposAvaria.length > 0
                            ? tiposAvaria.map(o => <option key={o.valor} value={o.valor}>{o.valor}</option>)
                            : ['Mecânica','Carroceria','Elétrica','Pneu','Outro'].map(v => <option key={v} value={v}>{v}</option>)
                          }
                        </select>
                        {/* Gravidade */}
                        <select value={av.gravidade} onChange={e => atualizarAvaria(i, 'gravidade', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500">
                          <option value="">Gravidade *</option>
                          {gravidadesAvaria.length > 0
                            ? gravidadesAvaria.map(o => <option key={o.valor} value={o.valor}>{o.valor}</option>)
                            : ['Leve','Moderada','Grave','Crítica'].map(v => <option key={v} value={v}>{v}</option>)
                          }
                        </select>
                        {/* Foto obrigatória */}
                        <label className="flex items-center gap-3 cursor-pointer bg-gray-50 rounded-xl p-3 border border-gray-200">
                          <input type="file" accept="image/*" capture="environment" className="sr-only"
                            onChange={e => { const f = e.target.files?.[0]; if (f) atualizarAvaria(i, 'foto', f) }} />
                          {av.fotoPreview ? (
                            <img src={av.fotoPreview} alt="" className="w-14 h-14 rounded-xl object-cover" />
                          ) : (
                            <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center border-2 border-dashed border-red-200">
                              <Camera className="w-5 h-5 text-red-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-gray-700 text-sm font-medium">Foto da avaria *</p>
                            <p className="text-gray-400 text-xs">{av.fotoPreview ? 'Toque para alterar' : 'Obrigatório — toque para fotografar'}</p>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                  <button onClick={adicionarAvaria}
                    className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-2xl py-4 text-gray-500 text-sm font-medium bg-white">
                    <Plus className="w-4 h-4" /> Adicionar Avaria
                  </button>
                </>
              )}

              {/* ── Etapa 6: Assinatura + CPF + Email ── */}
              {etapa === 6 && (
                <>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <SignatureCanvas onChange={setAssinatura} />
                  </div>

                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">CPF *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cpf}
                        onChange={e => { setCpf(formatCPF(e.target.value)); setCpfErro('') }}
                        placeholder="000.000.000-00"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      {cpfErro && <p className="text-red-500 text-xs mt-1.5">{cpfErro}</p>}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">E-mail para PDF</label>
                      <input
                        type="email"
                        value={emailEnvio}
                        onChange={e => setEmailEnvio(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  <button
                    onClick={enviar}
                    disabled={enviando || !assinatura || cpf.replace(/\D/g, '').length < 11}
                    className="w-full text-white font-bold rounded-2xl py-4 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
                    {enviando && <Loader2 className="w-5 h-5 animate-spin" />}
                    {enviando ? 'Enviando...' : 'Enviar Checklist'}
                  </button>
                </>
              )}
            </div>

            {/* Rodapé nav (etapas 1-5, não na 6 pois botão enviar está inline) */}
            {etapa < 6 && (
              <div className="flex gap-3 px-5 pb-6 pt-2 bg-[#F4F6FB] shrink-0">
                <button onClick={tryVoltar}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={avancar}
                  disabled={
                    (etapa === 2 && !tipoChecklist) ||
                    (etapa === 4 && (!fotoFrente || !fotoTras)) ||
                    (etapa === 5 && avariasSemFoto() && avarias.length > 0)
                  }
                  className="flex-1 text-white rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
                  {etapa === 5 ? 'Continuar' : 'Avançar'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // ─── Lista de checklists ───────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6FB] pb-20">

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">FleetFlow</span>
          </div>
          <Link href="/app/notificacoes"><Bell className="w-5 h-5 text-gray-400" /></Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Checklist Diário</h1>
        <p className="text-gray-500 text-sm mt-0.5">Realize a inspeção antes de iniciar a rota.</p>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Botão iniciar */}
        <button
          onClick={iniciar}
          disabled={!ativo}
          title={!ativo ? 'Nenhum veículo vinculado. Consulte seu gestor.' : undefined}
          className="w-full text-white font-bold rounded-2xl py-4 text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
          <ClipboardCheck className="w-5 h-5" />
          {ativo ? 'Iniciar Checklist' : 'Nenhum veículo vinculado'}
        </button>

        {/* Histórico */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Histórico</p>

          {loadingList ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100" />)}
            </div>
          ) : historico.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum checklist realizado</p>
              <p className="text-gray-400 text-xs mt-1">Toque em Iniciar Checklist para começar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historico.map(ck => {
                const badge  = STATUS_BADGE[ck.status] ?? { label: ck.status, cls: 'bg-gray-100 text-gray-600' }
                const dt     = ck.data_hora ? new Date(ck.data_hora) : null
                const dataFmt = dt?.toLocaleDateString('pt-BR') ?? '—'
                const horaFmt = dt?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) ?? ''
                return (
                  <div key={ck.id} className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <p className="text-gray-900 font-semibold text-sm font-mono truncate">{ck.id}</p>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {dataFmt} {horaFmt && `· ${horaFmt}`}
                        {ck.km && ` · ${Number(ck.km).toLocaleString('pt-BR')} km`}
                      </p>
                      <p className="text-gray-400 text-xs">{ck.tipo === 'pre' ? 'Pré-operação' : 'Pós-operação'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {ck.pdf_url ? (
                        <a href={ck.pdf_url} target="_blank" rel="noopener noreferrer"
                           className="p-1.5 bg-indigo-50 rounded-lg" title="Abrir PDF">
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                        </a>
                      ) : (
                        <button disabled className="p-1.5 bg-gray-100 rounded-lg opacity-40 cursor-not-allowed" title="PDF não disponível">
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={sentinelRef} className="h-4" />
              {loadingMore && (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              )}
              {!hasMore && historico.length > 0 && (
                <p className="text-gray-400 text-xs text-center py-3">Todos os registros exibidos</p>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
