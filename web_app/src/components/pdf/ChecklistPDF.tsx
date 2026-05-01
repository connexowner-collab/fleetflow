import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Registro de fonte para garantir que o PDF tenha uma tipografia profissional
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCOjAkpq_9JWuvg5NWRS65lbM_1_v8.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcC7jAkpq_9JWuvg5NWRS65lbM_1_v8.ttf', fontWeight: 700 },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica', // Usando Helvetica como fallback seguro
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#1E40AF',
    paddingBottom: 15,
    marginBottom: 20,
  },
  brandName: {
    fontSize: 22,
    color: '#1E40AF',
    fontWeight: 'bold',
  },
  brandSub: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  reportTitle: {
    fontSize: 20,
    color: '#111827',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
    gap: 5,
  },
  statusText: {
    fontSize: 8,
    backgroundColor: '#F3F4F6',
    padding: '3 8',
    borderRadius: 4,
    color: '#374151',
    textTransform: 'uppercase',
  },
  idText: {
    fontSize: 8,
    backgroundColor: '#1E40AF',
    padding: '3 8',
    borderRadius: 4,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 12,
    color: '#1E40AF',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 10,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
  },
  vehicleGrid: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 20,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 7,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 'bold',
  },
  featuredContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  featuredImage: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    borderRadius: 8,
  },
  imageCaption: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 5,
    fontStyle: 'italic',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: '6 10',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: 10,
  },
  tableHeaderText: {
    fontSize: 9,
    color: '#1E40AF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '8 10',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  checkbox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: '#1E40AF',
    backgroundColor: '#1E40AF',
    marginRight: 10,
    borderRadius: 2,
  },
  itemText: {
    fontSize: 9,
    color: '#374151',
    flex: 1,
  },
  itemObs: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'right',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  photoContainer: {
    width: '48%',
    marginBottom: 10,
  },
  photo: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
    borderRadius: 4,
  },
  photoType: {
    fontSize: 7,
    color: '#6B7280',
    marginTop: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 20,
  },
  footerGrid: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  signatureArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    gap: 40,
  },
  signatureBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#9CA3AF',
    paddingTop: 5,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 8,
    color: '#374151',
    textTransform: 'uppercase',
  },
  copyright: {
    fontSize: 7,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  }
});

interface Props {
  checklist: any;
  itens: any[];
  fotos: any[];
}

export const ChecklistPDFDoc = ({ checklist, itens, fotos }: Props) => {
  const dataFormatada = checklist.created_at 
    ? new Date(checklist.created_at).toLocaleDateString('pt-BR') 
    : new Date().toLocaleDateString('pt-BR');
    
  const horaFormatada = checklist.created_at 
    ? new Date(checklist.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const fotoDestaque = fotos.find(f => f.tipo === 'Frente' || f.tipo === 'Lateral Direita')?.url;

  return (
    <Document title={`Relatorio-${checklist.codigo_sequencial || 'CHK'}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>Checklist Pro</Text>
            <Text style={styles.brandSub}>Industrial Automotive Standards</Text>
          </View>
          <View>
            <Text style={styles.reportTitle}>Relatório de Inspeção</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>STATUS: {checklist.status || 'PENDENTE'}</Text>
              <Text style={styles.idText}>ID: {checklist.codigo_sequencial || '00000'}</Text>
            </View>
          </View>
        </View>

        {/* Info Grid */}
        <Text style={styles.sectionTitle}>Dados do Veículo</Text>
        <View style={styles.vehicleGrid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Modelo / Marca</Text>
            <Text style={styles.gridValue}>{checklist.veiculo_modelo || '—'}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Placa</Text>
            <Text style={styles.gridValue}>{checklist.placa || '—'}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Odômetro</Text>
            <Text style={styles.gridValue}>{checklist.km_atual?.toLocaleString('pt-BR') || '0'} km</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Data</Text>
            <Text style={styles.gridValue}>{dataFormatada}</Text>
          </View>
        </View>

        {/* Foto Principal */}
        {fotoDestaque && (
          <View style={styles.featuredContainer}>
            <Image src={fotoDestaque} style={styles.featuredImage} />
            <Text style={styles.imageCaption}>Registro de Entrada — Evidência Visual Principal</Text>
          </View>
        )}

        {/* Seção 01: Exterior */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>01. Inspeção de Itens</Text>
        </View>
        {itens.filter(i => !i.nome.startsWith('!!AVARIA!!')).map((item, idx) => {
          const [nome, obs] = item.nome.split(' | ');
          return (
            <View key={idx} style={styles.tableRow}>
              <View style={[styles.checkbox, !item.conforme ? { backgroundColor: '#EF4444', borderColor: '#EF4444' } : {}]} />
              <Text style={styles.itemText}>{nome}</Text>
              <Text style={styles.itemObs}>{item.conforme ? 'OK' : (obs || 'FALHA')}</Text>
            </View>
          );
        })}

        {/* Avarias se houver */}
        {itens.some(i => i.nome.startsWith('!!AVARIA!!')) && (
          <>
            <View style={[styles.tableHeader, { marginTop: 20 }]}>
              <Text style={styles.tableHeaderText}>02. Detalhamento de Avarias</Text>
            </View>
            {itens.filter(i => i.nome.startsWith('!!AVARIA!!')).map((item, idx) => {
              const [_, tipo, gravidade, descricao] = item.nome.split('|');
              return (
                <View key={idx} style={styles.tableRow}>
                  <View style={[styles.checkbox, { backgroundColor: '#EF4444', borderColor: '#EF4444' }]} />
                  <Text style={styles.itemText}>{tipo} ({gravidade})</Text>
                  <Text style={[styles.itemObs, { color: '#EF4444' }]}>{descricao}</Text>
                </View>
              );
            })}
          </>
        )}

        {/* Observações Gerais */}
        {(checklist.observacoes || checklist.observacao) && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Observações Gerais</Text>
            <Text style={{ fontSize: 9, color: '#374151', lineHeight: 1.4 }}>
              {checklist.observacoes || checklist.observacao}
            </Text>
          </View>
        )}

        {/* Galeria de Fotos */}
        {fotos.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Evidências Fotográficas</Text>
            <View style={styles.photoGrid}>
              {fotos.map((foto, idx) => (
                <View key={idx} style={styles.photoContainer}>
                  <Image src={foto.url} style={styles.photo} />
                  <Text style={styles.photoType}>{foto.tipo}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer / Assinaturas */}
        <View style={styles.footer}>
          <View style={styles.footerGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Inspetor Responsável</Text>
              <Text style={styles.gridValue}>{checklist.motorista_nome || '—'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Localização</Text>
              <Text style={styles.gridValue}>Unidade Central</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Horário do Registro</Text>
              <Text style={styles.gridValue}>{horaFormatada}</Text>
            </View>
          </View>

          <View style={styles.signatureArea}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Assinatura do Técnico</Text>
            </View>
            <View style={styles.signatureBox}>
              {checklist.assinatura_base64 && (
                <Image 
                  src={checklist.assinatura_base64} 
                  style={{ width: 120, height: 40, marginBottom: 5 }} 
                />
              )}
              <Text style={styles.signatureLabel}>Assinatura do Motorista</Text>
            </View>
          </View>

          <Text style={styles.copyright}>
            © 2026 FleetFlow Automotive Inspection Standards. Relatório Gerado Digitalmente.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
