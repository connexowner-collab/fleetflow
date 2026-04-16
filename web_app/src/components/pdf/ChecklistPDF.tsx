import React from 'react'
import {
  Document, Page, Text, View, StyleSheet
} from '@react-pdf/renderer'

interface ChecklistData {
  id: string
  codigo_sequencial?: string
  motorista_nome?: string
  placa?: string
  veiculo_modelo?: string
  km_atual?: number
  status?: string
  created_at?: string
  tipo?: string
  observacoes?: string
  cpf?: string
  email?: string
}

interface ItemData {
  nome: string
  conforme: boolean
}

interface FotoData {
  tipo: string
  url: string
}

interface Props {
  checklist: ChecklistData
  itens: ItemData[]
  fotos: FotoData[]
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#1a1a1a',
  },
  header: {
    borderBottom: '2px solid #2563eb',
    paddingBottom: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  logo: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
  },
  logoSub: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: {
    textAlign: 'right',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 4,
    marginBottom: 8,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  field: {
    width: '50%',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 1,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 10,
    color: '#1f2937',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottom: '0.5px solid #f3f4f6',
  },
  itemNome: {
    fontSize: 9,
    color: '#374151',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  badgeOk: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeNok: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '0.5px solid #e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
})

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABEL: Record<string, string> = {
  aprovado:    'APROVADO',
  pendente:    'COM PENDÊNCIAS',
  validado:    'VALIDADO',
  reprovado:   'REPROVADO',
  com_pendencias: 'COM PENDÊNCIAS',
}

export function ChecklistPDFDoc({ checklist, itens, fotos }: Props) {
  const statusLabel = STATUS_LABEL[checklist.status ?? ''] ?? (checklist.status ?? '').toUpperCase()
  const isAprovado  = ['aprovado', 'validado'].includes(checklist.status ?? '')

  return (
    <Document title={`Checklist ${checklist.codigo_sequencial ?? checklist.id}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>FleetFlow</Text>
            <Text style={styles.logoSub}>Sistema de Gestão de Frotas</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>Relatório de Checklist Diário</Text>
            <Text style={[styles.fieldLabel, { textAlign: 'right' }]}>
              {checklist.codigo_sequencial ? `#${checklist.codigo_sequencial}` : `ID: ${checklist.id?.slice(0, 8)}`}
            </Text>
          </View>
        </View>

        {/* Status */}
        <View style={[styles.section, { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }]}>
          <Text style={[styles.statusBadge, isAprovado ? { backgroundColor: '#dcfce7', color: '#166534' } : { backgroundColor: '#fef3c7', color: '#92400e' }]}>
            {statusLabel}
          </Text>
          <Text style={styles.footerText}>{fmtDate(checklist.created_at)}</Text>
        </View>

        {/* Identificação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação do Ativo</Text>
          <View style={styles.grid2}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Placa</Text>
              <Text style={styles.fieldValue}>{checklist.placa || '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Modelo</Text>
              <Text style={styles.fieldValue}>{checklist.veiculo_modelo || '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>KM Atual</Text>
              <Text style={styles.fieldValue}>{checklist.km_atual ? `${checklist.km_atual.toLocaleString('pt-BR')} km` : '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Tipo</Text>
              <Text style={styles.fieldValue}>{checklist.tipo || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Motorista */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Motorista</Text>
          <View style={styles.grid2}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nome</Text>
              <Text style={styles.fieldValue}>{checklist.motorista_nome || '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>CPF</Text>
              <Text style={styles.fieldValue}>{checklist.cpf || '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>E-mail</Text>
              <Text style={styles.fieldValue}>{checklist.email || '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Data/Hora</Text>
              <Text style={styles.fieldValue}>{fmtDate(checklist.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Itens de Inspeção */}
        {itens.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inspeção Técnica ({itens.length} itens)</Text>
            {itens.map((item, i) => (
              <View key={i} style={styles.item}>
                <Text style={styles.itemNome}>{item.nome}</Text>
                <Text style={[styles.badge, item.conforme ? styles.badgeOk : styles.badgeNok]}>
                  {item.conforme ? 'CONFORME' : 'NÃO CONFORME'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Observações */}
        {checklist.observacoes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={[styles.fieldValue, { lineHeight: 1.5 }]}>{checklist.observacoes}</Text>
          </View>
        )}

        {/* Fotos (apenas lista de URLs - sem embed) */}
        {fotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidências Fotográficas ({fotos.length} foto{fotos.length > 1 ? 's' : ''})</Text>
            {fotos.map((f, i) => (
              <Text key={i} style={[styles.footerText, { marginBottom: 2 }]}>
                {i + 1}. {f.tipo?.toUpperCase() || 'FOTO'}: {f.url?.slice(0, 80)}...
              </Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>FleetFlow — Relatório de Checklist</Text>
          <Text style={styles.footerText}>Gerado em {new Date().toLocaleString('pt-BR')}</Text>
        </View>
      </Page>
    </Document>
  )
}
