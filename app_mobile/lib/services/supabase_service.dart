import 'package:supabase_flutter/supabase_flutter.dart';
import 'app_data_service.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  SupabaseClient get _client => Supabase.instance.client;

  // ── Auth ──────────────────────────────────────────────────
  String? get currentUserId => _client.auth.currentUser?.id;
  String? get currentUserEmail => _client.auth.currentUser?.email;

  bool get isLoggedIn => _client.auth.currentUser != null;

  Future<void> signOut() => _client.auth.signOut();

  // ── Checklist ─────────────────────────────────────────────
  Future<String?> saveChecklist(ChecklistData data) async {
    try {
      final response = await _client.from('checklists').insert({
        'motorista': data.motorista,
        'placa': data.placa,
        'unidade': data.unidade,
        'setor': data.setor,
        'area': data.area,
        'veiculo': data.veiculo,
        'km_anterior': data.kmAnterior,
        'km_atual': data.kmAtual,
        'itens_json': data.itens,
        'observacao': data.observacao,
        'tem_avaria': data.temAvaria,
        'categoria_avaria': data.categoriaAvaria,
        'gravidade_avaria': data.gravidadeAvaria,
        'descricao_avaria': data.descricaoAvaria,
        'solicitou_troca': data.solicitouTroca,
      }).select('id, codigo').single();
      return response['codigo'] as String?;
    } catch (_) {
      return null;
    }
  }

  Future<List<ChecklistData>> getChecklists() async {
    try {
      final data = await _client
          .from('checklists')
          .select()
          .order('created_at', ascending: false)
          .limit(50);

      return (data as List).map((row) => ChecklistData(
        id: row['codigo'] ?? row['id'],
        motorista: row['motorista'] ?? '',
        placa: row['placa'] ?? '',
        unidade: row['unidade'] ?? '',
        setor: row['setor'] ?? '',
        area: row['area'] ?? '',
        veiculo: row['veiculo'] ?? '',
        kmAnterior: row['km_anterior'] ?? 0,
        kmAtual: row['km_atual'] ?? 0,
        itens: Map<String, bool>.from(row['itens_json'] ?? {}),
        observacao: row['observacao'] ?? '',
        dataCriacao: DateTime.parse(row['created_at']),
        temAvaria: row['tem_avaria'] ?? false,
        categoriaAvaria: row['categoria_avaria'],
        gravidadeAvaria: row['gravidade_avaria'],
        descricaoAvaria: row['descricao_avaria'],
        solicitouTroca: row['solicitou_troca'] ?? false,
      )).toList();
    } catch (_) {
      return [];
    }
  }

  // ── Ocorrência ────────────────────────────────────────────
  Future<void> saveOcorrencia(OcorrenciaData data) async {
    try {
      await _client.from('ocorrencias').insert({
        'motorista': data.motorista,
        'placa': data.placa,
        'veiculo': data.veiculo,
        'categoria': data.categoria,
        'gravidade': data.gravidade,
        'descricao': data.descricao,
        'checklist_ref': data.checklistId,
        'status': data.status,
      });
    } catch (_) {}
  }

  // ── Troca ─────────────────────────────────────────────────
  Future<void> saveTroca(TrocaData data) async {
    try {
      await _client.from('trocas').insert({
        'motorista': data.motorista,
        'veiculo_antigo': data.veiculoAntigo,
        'veiculo_novo': data.veiculoNovo,
        'checklist_ref': data.checklistId,
        'status': data.status,
      });
    } catch (_) {}
  }
}
