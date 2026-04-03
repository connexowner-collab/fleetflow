import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
import '../services/app_data_service.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});
  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final _data = AppDataService();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final checklists = _data.checklists;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(title: const Text('Meu Histórico', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: theme.primaryColor, foregroundColor: Colors.white),
      body: checklists.isEmpty ? _empty() : ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: checklists.length,
        itemBuilder: (context, i) => _card(context, checklists[i], theme),
      ),
    );
  }

  Widget _empty() => const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
    Icon(Icons.history, size: 64, color: Colors.black12),
    SizedBox(height: 16),
    Text('Nenhum checklist gerado ainda.', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
  ]));

  Widget _card(BuildContext context, ChecklistData item, ThemeData theme) {
    final dateStr = DateFormat('dd/MM/yyyy • HH:mm').format(item.dataCriacao);
    final nonConformCount = item.itens.values.where((v) => !v).length;
    Color statusColor;
    String statusLabel;
    IconData statusIcon;
    if (item.temAvaria) {
      statusColor = Colors.red; statusLabel = 'Avaria (${item.gravidadeAvaria})'; statusIcon = Icons.warning;
    } else if (nonConformCount > 0) {
      statusColor = Colors.orange; statusLabel = '$nonConformCount não conforme(s)'; statusIcon = Icons.info_outline;
    } else {
      statusColor = Colors.green; statusLabel = 'Aprovado'; statusIcon = Icons.check_circle;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade100), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6, offset: const Offset(0, 2))]),
      child: Column(children: [
        Padding(padding: const EdgeInsets.all(16), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), shape: BoxShape.circle), child: Icon(statusIcon, color: statusColor, size: 20)),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(item.id, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16))),
              Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w900))),
            ]),
            const SizedBox(height: 4),
            Text(item.placa, style: TextStyle(color: theme.primaryColor, fontWeight: FontWeight.w900, fontSize: 14)),
            Text(dateStr, style: TextStyle(color: Colors.grey.shade500, fontSize: 11, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('${item.veiculo.split('(')[0].trim()} • ${item.unidade}', style: const TextStyle(color: Colors.black54, fontSize: 11)),
            Text('KM: ${item.kmAtual}  •  ${item.setor}', style: const TextStyle(color: Colors.black38, fontSize: 11)),
          ])),
        ])),
        if (item.temAvaria || item.solicitouTroca)
          Padding(padding: const EdgeInsets.fromLTRB(16, 0, 16, 10), child: Wrap(spacing: 8, children: [
            if (item.temAvaria) _badge(Icons.warning_amber, 'Ocorrência: ${item.categoriaAvaria}', Colors.red),
            if (item.solicitouTroca) _badge(Icons.swap_horiz, 'Troca Solicitada', Colors.orange),
          ])),
        Container(
          decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.grey.shade100))),
          child: Row(children: [
            Expanded(child: TextButton.icon(
              onPressed: () => _viewPdf(context, item),
              icon: const Icon(Icons.picture_as_pdf, size: 16),
              label: const Text('Ver PDF', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              style: TextButton.styleFrom(foregroundColor: theme.primaryColor, padding: const EdgeInsets.symmetric(vertical: 12)),
            )),
            Container(width: 1, height: 36, color: Colors.grey.shade100),
            Expanded(child: TextButton.icon(
              onPressed: () => _share(context, item),
              icon: const Icon(Icons.share, size: 16),
              label: const Text('Compartilhar', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              style: TextButton.styleFrom(foregroundColor: const Color(0xFF6AB023), padding: const EdgeInsets.symmetric(vertical: 12)),
            )),
          ]),
        ),
      ]),
    );
  }

  Widget _badge(IconData icon, String lbl, Color col) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(color: col.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(8), border: Border.all(color: col.withValues(alpha: 0.25))),
    child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 12, color: col), const SizedBox(width: 4), Text(lbl, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: col))]),
  );

  // ── PDF ──────────────────────────────────────────────────

  Future<pw.Document> _makePdf(ChecklistData item) async {
    final pdf = pw.Document();
    final dateStr = DateFormat('dd/MM/yyyy HH:mm').format(item.dataCriacao);
    final blue = PdfColor.fromHex('#0F5AC4');
    final green = PdfColor.fromHex('#6AB023');

    pdf.addPage(pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(32),
      header: (_) => pw.Column(children: [
        pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
          pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
            pw.Text('FLEETFLOW', style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold, color: blue)),
            pw.Text('Gestão de Frota SaaS', style: pw.TextStyle(fontSize: 9, color: PdfColors.grey)),
          ]),
          pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.end, children: [
            pw.Text('CHECKLIST DIÁRIO', style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold)),
            pw.Text(item.id, style: pw.TextStyle(fontSize: 12, color: blue, fontWeight: pw.FontWeight.bold)),
          ]),
        ]),
        pw.Divider(color: blue, thickness: 2),
        pw.SizedBox(height: 6),
      ]),
      build: (_) => [
        pw.Container(padding: const pw.EdgeInsets.all(14), decoration: pw.BoxDecoration(color: PdfColors.grey100, borderRadius: pw.BorderRadius.circular(6)), child: pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
          pw.Text('DADOS DA INSPEÇÃO', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: blue)),
          pw.SizedBox(height: 8),
          pw.Row(children: [pw.Expanded(child: _pr('Motorista', item.motorista)), pw.Expanded(child: _pr('Placa', item.placa))]),
          pw.Row(children: [pw.Expanded(child: _pr('Data', dateStr)), pw.Expanded(child: _pr('Veículo', item.veiculo.split('(')[0].trim()))]),
          pw.Row(children: [pw.Expanded(child: _pr('Unidade', item.unidade)), pw.Expanded(child: _pr('Setor', item.setor))]),
          pw.Row(children: [pw.Expanded(child: _pr('KM Anterior', '${item.kmAnterior} km')), pw.Expanded(child: _pr('KM Atual', '${item.kmAtual} km'))]),
        ])),
        pw.SizedBox(height: 14),
        pw.Text('ITENS DE VERIFICAÇÃO', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: blue)),
        pw.SizedBox(height: 6),
        ...item.itens.entries.map((e) => pw.Container(
          margin: const pw.EdgeInsets.only(bottom: 5),
          padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: pw.BoxDecoration(color: e.value ? PdfColors.green50 : PdfColors.red50, borderRadius: pw.BorderRadius.circular(4), border: pw.Border.all(color: e.value ? PdfColors.green200 : PdfColors.red200)),
          child: pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
            pw.Text(e.key, style: const pw.TextStyle(fontSize: 10)),
            pw.Text(e.value ? '✓ CONFORME' : '✗ NÃO CONFORME', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: e.value ? PdfColors.green800 : PdfColors.red800)),
          ]),
        )),
        if (item.observacao.isNotEmpty) ...[
          pw.SizedBox(height: 10),
          pw.Text('OBSERVAÇÕES', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: blue)),
          pw.SizedBox(height: 4),
          pw.Container(padding: const pw.EdgeInsets.all(10), decoration: pw.BoxDecoration(color: PdfColors.grey100, borderRadius: pw.BorderRadius.circular(4)), child: pw.Text(item.observacao, style: const pw.TextStyle(fontSize: 10))),
        ],
        if (item.temAvaria) ...[
          pw.SizedBox(height: 14),
          pw.Container(padding: const pw.EdgeInsets.all(14), decoration: pw.BoxDecoration(color: PdfColors.red50, borderRadius: pw.BorderRadius.circular(6), border: pw.Border.all(color: PdfColors.red300)), child: pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
            pw.Text('AVARIA REGISTRADA', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold, color: PdfColors.red800)),
            pw.SizedBox(height: 6),
            _pr('Categoria', item.categoriaAvaria ?? '-'),
            _pr('Gravidade', item.gravidadeAvaria ?? '-'),
            _pr('Descrição', item.descricaoAvaria ?? '-'),
          ])),
        ],
        if (item.solicitouTroca) ...[
          pw.SizedBox(height: 10),
          pw.Container(padding: const pw.EdgeInsets.all(10), decoration: pw.BoxDecoration(color: PdfColor.fromHex('#FFF3E0'), borderRadius: pw.BorderRadius.circular(4), border: pw.Border.all(color: PdfColor.fromHex('#FFB300'))),
            child: pw.Text('⚠ SOLICITAÇÃO DE TROCA VINCULADA — AGUARDA APROVAÇÃO DO GESTOR', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('#E65100')))),
        ],
        pw.SizedBox(height: 20),
        pw.Divider(),
        pw.SizedBox(height: 6),
        pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
          pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
            pw.Text('Assinatura Digital', style: pw.TextStyle(fontSize: 9, color: PdfColors.grey)),
            pw.Text(item.motorista, style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold, color: blue)),
          ]),
          pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.end, children: [
            pw.Text('Gerado pelo FleetFlow App', style: pw.TextStyle(fontSize: 8, color: PdfColors.grey)),
            pw.Text(dateStr, style: pw.TextStyle(fontSize: 8, color: PdfColors.grey)),
          ]),
        ]),
        pw.SizedBox(height: 4),
        pw.Container(height: 3, color: green),
      ],
    ));

    return pdf;
  }

  pw.Widget _pr(String lbl, String val) => pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 3),
    child: pw.RichText(text: pw.TextSpan(children: [
      pw.TextSpan(text: '$lbl: ', style: pw.TextStyle(fontSize: 9, color: PdfColors.grey700, fontWeight: pw.FontWeight.bold)),
      pw.TextSpan(text: val, style: const pw.TextStyle(fontSize: 9)),
    ])),
  );

  Future<void> _viewPdf(BuildContext context, ChecklistData item) async {
    final pdf = await _makePdf(item);
    final bytes = await pdf.save();
    if (!context.mounted) return;
    await Navigator.push(context, MaterialPageRoute(
      builder: (_) => Scaffold(
        appBar: AppBar(
          title: Text('PDF — ${item.id}'),
          backgroundColor: const Color(0xFF0F5AC4), foregroundColor: Colors.white,
          actions: [
            IconButton(icon: const Icon(Icons.share), onPressed: () async {
              final dir = await getTemporaryDirectory();
              final file = File('${dir.path}/${item.id}.pdf');
              await file.writeAsBytes(bytes);
              await Share.shareXFiles([XFile(file.path)], subject: 'Checklist ${item.id} — FleetFlow');
            }),
          ],
        ),
        body: PdfPreview(build: (_) => bytes, allowPrinting: true, allowSharing: true, canChangePageFormat: false),
      ),
    ));
  }

  Future<void> _share(BuildContext context, ChecklistData item) async {
    final dateStr = DateFormat('dd/MM/yyyy HH:mm').format(item.dataCriacao);
    final nonConform = item.itens.entries.where((e) => !e.value).map((e) => '   ❌ ${e.key}').join('\n');
    final text = [
      '📋 *CHECKLIST DIÁRIO — FleetFlow*',
      'ID: ${item.id} | Data: $dateStr',
      '',
      '🚛 Veículo: ${item.veiculo}',
      '📍 Placa: ${item.placa}',
      '👤 Motorista: ${item.motorista}',
      '🏢 ${item.unidade} | ${item.setor} | ${item.area}',
      '🛣️ KM: ${item.kmAtual}',
      '',
      nonConform.isEmpty ? '✅ Todos os itens conformes' : '⚠️ Não conformes:\n$nonConform',
      if (item.temAvaria) '\n🔴 Avaria: ${item.categoriaAvaria} (${item.gravidadeAvaria})\n${item.descricaoAvaria}',
      if (item.solicitouTroca) '\n🔄 Troca de veículo solicitada — aguarda aprovação',
      '\n_Gerado pelo FleetFlow App_',
    ].join('\n');

    try {
      final pdf = await _makePdf(item);
      final bytes = await pdf.save();
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/${item.id}.pdf');
      await file.writeAsBytes(bytes);
      await Share.shareXFiles([XFile(file.path)], text: text, subject: 'Checklist ${item.id} — FleetFlow');
    } catch (_) {
      await Share.share(text, subject: 'Checklist ${item.id} — FleetFlow');
    }
  }
}
