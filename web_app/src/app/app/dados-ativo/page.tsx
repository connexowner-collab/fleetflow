"use client"

import { useCallback, useEffect, useState } from 'react'
import { Bell, Car, RefreshCw, FileText, History, Download, CheckCircle2, AlertTriangle, XCircle, ExternalLink, Eye, X } from 'lucide-react'
import BottomNav from '../components/BottomNav'

interface Veiculo {
  id: string; placa: string; marca: string; modelo: string
  ano_fabricacao: number; ano_modelo: number; tipo: string
  combustivel: string; cor: string; renavam: string; chassi: string
  filial: string; km_atual: number; status: string; capacidade: string | null
}

interface Documento {
  tipo: string; data_vencimento: string | null; url_anexo: string | null;
}

interface Checklist {
  id: string; id_real: string; data: string; status: string; km: string
  tipo_checklist: string; pdf_url: string | null
}

const TIPO_LABEL: Record<string, string> = {
  CRLV: 'CRLV', Seguro: 'Seguro', Licenciamento: 'Licenciamento', Tacógrafo: 'Tacógrafo', ANTT: 'ANTT', Outros: 'Outros'
}

function docStatus(vencimento: string | null) {
  if (!vencimento) return 'sem_data'
  const diff = new Date(vencimento).getTime() - Date.now()
  const dias  = Math.floor(diff / 86400000)
  if (dias < 0)  return 'vencido'
  if (dias < 30) return 'alerta'
  return 'ok'
}

function DocBadge({ status }: { status: string }) {
  if (status === 'ok')      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />OK</span>
  if (status === 'alerta')  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Alerta</span>
  if (status === 'vencido') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1"><XCircle className="w-3 h-3" />Vencido</span>
  return null
}

const STATUS_CHECKLIST: Record<string, string> = {
  Aprovado:        'bg-green-100 text-green-700',
  'Com Pendências':'bg-yellow-100 text-yellow-700',
  Validado:        'bg-emerald-100 text-emerald-700',
  Recusado:        'bg-red-100 text-red-700',
  Pendente:        'bg-gray-100 text-gray-600',
}

export default function DadosAtivoPage() {
  const [veiculo,    setVeiculo]    = useState<Veiculo | null>(null)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [aba,        setAba]        = useState<'dados'|'docs'|'historico'>('dados')
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null)

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const [vRes, cRes] = await Promise.all([
        fetch('/api/app/veiculo'),
        fetch('/api/app/checklist?limit=20'),
      ])
      const vJson = await vRes.json()
      const cJson = await cRes.json()
      setVeiculo(vJson.veiculo ?? null)
      setDocumentos(vJson.documentos ?? [])
      setChecklists((cJson.checklists ?? []).map((c: Record<string,unknown>) => ({
        id:            c.codigo ?? c.id,
        id_real:       c.id,
        data:          new Date(c.created_at as string).toLocaleDateString('pt-BR'),
        status:        String(c.status ?? 'Pendente'),
        km:            Number(c.km_atual ?? 0).toLocaleString('pt-BR'),
        tipo_checklist: String(c.tipo_checklist ?? 'Pré-operação'),
        pdf_url:       (c.pdf_url as string | null) ?? null,
      })))
    } catch { /* offline */ } finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col h-screen bg-[#F4F6FB]">

      {/* Banner do veículo */}
      <div className="relative"
           style={{ background: 'linear-gradient(135deg,#4B3FE4 0%,#7C3AED 60%,#A78BFA 100%)', minHeight: 180 }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Car className="w-48 h-48 text-white" />
        </div>
        <div className="relative px-5 pt-12 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">FleetFlow</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => load(true)} className="p-1.5 bg-white/20 rounded-lg">
                <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Bell className="w-5 h-5 text-white/70" />
            </div>
          </div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-6 w-32 bg-white/20 rounded animate-pulse" />
              <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
            </div>
          ) : veiculo ? (
            <>
              <span className="bg-green-400 text-green-900 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-2">
                <CheckCircle2 className="w-3 h-3" /> {veiculo.status}
              </span>
              <p className="text-white/80 text-sm font-medium">{veiculo.placa}</p>
              <h1 className="text-white font-bold text-2xl">{veiculo.marca} {veiculo.modelo} {veiculo.ano_fabricacao}</h1>
            </>
          ) : (
            <p className="text-white/70 text-sm">Nenhum veículo vinculado</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white px-5 border-b border-gray-100">
        <div className="flex">
          {([
            { id: 'dados',    label: 'Dados do Veículo' },
            { id: 'docs',     label: 'Documentação' },
            { id: 'historico',label: 'Histórico' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setAba(t.id)}
              className={`flex-1 py-3 text-xs font-bold transition-colors ${
                aba === t.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-400'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 space-y-3 pb-24">

        {/* Aba Dados */}
        {aba === 'dados' && !loading && veiculo && (
          <>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5 pt-4 pb-2">Identificação</p>
              {[
                { label: 'Placa',          value: veiculo.placa          },
                { label: 'Chassi',         value: veiculo.chassi         },
                { label: 'RENAVAM',        value: veiculo.renavam        },
                { label: 'Marca',          value: veiculo.marca          },
                { label: 'Modelo',         value: veiculo.modelo         },
                { label: 'Ano',            value: `${veiculo.ano_fabricacao ?? '—'}/${veiculo.ano_modelo ?? '—'}` },
                { label: 'Cor',            value: veiculo.cor            },
                { label: 'Tipo',           value: veiculo.tipo           },
                { label: 'Combustível',    value: veiculo.combustivel    },
                { label: 'Capacidade',     value: veiculo.capacidade     },
                { label: 'Filial',         value: veiculo.filial         },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
                  <span className="text-gray-500 text-sm">{row.label}</span>
                  <span className="text-gray-900 font-bold text-sm text-right">{row.value ?? '—'}</span>
                </div>
              ))}
            </div>

            {/* KM */}
            <div className="rounded-2xl p-5 text-white"
                 style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">KM Atual</p>
              <p className="text-4xl font-bold">{veiculo.km_atual.toLocaleString('pt-BR')} km</p>
            </div>
          </>
        )}

        {/* Aba Documentação */}
        {aba === 'docs' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {documentos.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Nenhum documento encontrado.
              </div>
            ) : (
              documentos.map((doc, idx) => {
                const st  = docStatus(doc.data_vencimento)
                const hasAnexo = !!doc.url_anexo
                return (
                  <div key={idx} className="flex items-center justify-between px-5 py-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-gray-900 font-semibold text-sm truncate">{TIPO_LABEL[doc.tipo] || doc.tipo}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {doc.data_vencimento ? `Vence: ${new Date(doc.data_vencimento + 'T12:00').toLocaleDateString('pt-BR')}` : 'Sem data'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <DocBadge status={st} />
                      {hasAnexo ? (
                        <button onClick={() => setSelectedDoc(doc)}
                           className="p-2 bg-indigo-50 rounded-xl" title="Ver anexo">
                          <Eye className="w-4 h-4 text-indigo-600" />
                        </button>
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center opacity-20">
                           <FileText className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Aba Histórico */}
        {aba === 'historico' && (
          <>
            {checklists.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Nenhum checklist realizado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {checklists.map(c => (
                  <div key={c.id_real} className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <p className="text-gray-900 font-semibold text-sm font-mono truncate">{c.id}</p>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">{c.data} · {c.tipo_checklist} · {c.km} km</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_CHECKLIST[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                      {c.pdf_url ? (
                        <a href={c.pdf_url} target="_blank" rel="noopener noreferrer"
                           className="p-1.5 bg-indigo-50 rounded-lg" title="Abrir PDF">
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                        </a>
                      ) : (
                        <button disabled
                          className="p-1.5 bg-gray-100 rounded-lg opacity-40 cursor-not-allowed"
                          title="PDF não disponível">
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />

      {/* Modal de Visualização de Anexo */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedDoc(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-gray-900 text-sm truncate">{selectedDoc.tipo}</span>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center min-h-[300px]">
              {selectedDoc.url_anexo?.toLowerCase().endsWith('.pdf') ? (
                <iframe src={selectedDoc.url_anexo} className="w-full h-full min-h-[500px]" />
              ) : (
                <img src={selectedDoc.url_anexo || ''} alt={selectedDoc.tipo} className="max-w-full max-h-full object-contain" />
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
              <button onClick={() => setSelectedDoc(null)}
                className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-all">
                Fechar
              </button>
              <a href={selectedDoc.url_anexo || ''} download target="_blank" rel="noopener noreferrer"
                className="flex-1 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all">
                <Download className="w-4 h-4" /> Baixar
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
