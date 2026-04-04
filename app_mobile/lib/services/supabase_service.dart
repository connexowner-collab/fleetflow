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

  // ── Perfil do usuário logado ───────────────────────────────
  Future<Map<String, dynamic>?> getProfile() async {
    try {
      final uid = currentUserId;
      if (uid == null) return null;
      final data = await _client
          .from('profiles')
          .select('id, nome, email, perfil, tenant_id, placa_vinculada')
          .eq('id', uid)
          .single();
      return data;
    } catch (_) {
      return null;
    }
  }

  // ── Dropdown options do checklist ─────────────────────────
  Future<Map<String, List<String>>> getOpcoesChecklist() async {
    try {
      final data = await _client
          .from('config_opcoes')
          .select('categoria, valor')
          .eq('ativo', true)
          .order('valor');

      final Map<String, List<String>> result = {
        'unidades': [],
        'setores': [],
        'areas': [],
      };

      for (final row in (data as List)) {
        final cat = row['categoria'] as String;
        final val = row['valor'] as String;
        if (cat == 'unidade') result['unidades']!.add(val);
        if (cat == 'setor') result['setores']!.add(val);
        if (cat == 'area') result['areas']!.add(val);
      }

      return result;
    } catch (_) {
      return {'unidades': [], 'setores': [], 'areas': []};
    }
  }

  // ── Veículos disponíveis ───────────────────────────────────
  Future<List<String>> getVeiculos() async {
    try {
      final data = await _client
          .from('veiculos')
          .select('placa, modelo')
          .order('placa');
      return (data as List).map((v) => '${v['modelo']} (${v['placa']})').toList();
    } catch (_) {
      return [];
    }
  }

  // ── Salvar checklist no Supabase ───────────────────────────
  Future<String?> saveChecklist(ChecklistData data, String? tenantId) async {
    try {
      if (tenantId == null) return null;

      final row = await _client.from('checklists').insert({
        'tenant_id': tenantId,
        'codigo': data.id,
        'motorista_id': currentUserId,
        'motorista_nome': data.motorista,
        'placa': data.placa,
        'veiculo_nome': data.veiculo,
        'unidade': data.unidade,
        'setor': data.setor,
        'area': data.area,
        'km_anterior': data.kmAnterior,
        'km_atual': data.kmAtual,
        'observacao': data.observacao,
        'status': 'Pendente',
        'tem_avaria': data.temAvaria,
        'solicita_troca': data.solicitouTroca,
        'itens_json': data.itens,
      }).select('id, codigo').single();

      return row['codigo'] as String?;
    } catch (_) {
      return null;
    }
  }

  // ── Salvar ocorrência ──────────────────────────────────────
  Future<void> saveOcorrencia(OcorrenciaData data, String? tenantId) async {
    try {
      if (tenantId == null) return;
      await _client.from('ocorrencias').insert({
        'tenant_id': tenantId,
        'codigo': data.id,
        'motorista_id': currentUserId,
        'motorista_nome': data.motorista,
        'placa': data.placa,
        'veiculo_nome': data.veiculo,
        'categoria': data.categoria,
        'gravidade': data.gravidade,
        'descricao': data.descricao,
        'status': 'Aberta',
      });
    } catch (_) {}
  }

  // ── Salvar troca ───────────────────────────────────────────
  Future<void> saveTroca(TrocaData data, String? tenantId) async {
    try {
      if (tenantId == null) return;
      await _client.from('trocas').insert({
        'tenant_id': tenantId,
        'codigo': data.id,
        'motorista_id': currentUserId,
        'motorista_nome': data.motorista,
        'veiculo_antigo_nome': data.veiculoAntigo,
        'veiculo_novo_nome': data.veiculoNovo,
        'status': 'Pendente',
      });
    } catch (_) {}
  }

  // ── Buscar checklists do usuário ───────────────────────────
  Future<List<ChecklistData>> getChecklists() async {
    try {
      final data = await _client
          .from('checklists')
          .select()
          .order('created_at', ascending: false)
          .limit(50);

      return (data as List).map((row) => ChecklistData(
        id: row['codigo'] ?? row['id'],
        motorista: row['motorista_nome'] ?? '',
        placa: row['placa'] ?? '',
        unidade: row['unidade'] ?? '',
        setor: row['setor'] ?? '',
        area: row['area'] ?? '',
        veiculo: row['veiculo_nome'] ?? '',
        kmAnterior: row['km_anterior'] ?? 0,
        kmAtual: row['km_atual'] ?? 0,
        itens: Map<String, bool>.from(row['itens_json'] ?? {}),
        observacao: row['observacao'] ?? '',
        dataCriacao: DateTime.parse(row['created_at']),
        temAvaria: row['tem_avaria'] ?? false,
        categoriaAvaria: null,
        gravidadeAvaria: null,
        descricaoAvaria: null,
        solicitouTroca: row['solicita_troca'] ?? false,
      )).toList();
    } catch (_) {
      return [];
    }
  }
}
