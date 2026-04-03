class ChecklistData {
  final String id;
  final String motorista;
  final String placa;
  final String unidade;
  final String setor;
  final String area;
  final String veiculo;
  final int kmAnterior;
  final int kmAtual;
  final Map<String, bool> itens;
  final String observacao;
  final DateTime dataCriacao;
  final bool temAvaria;
  final String? categoriaAvaria;
  final String? gravidadeAvaria;
  final String? descricaoAvaria;
  final bool solicitouTroca;

  ChecklistData({
    required this.id,
    required this.motorista,
    required this.placa,
    required this.unidade,
    required this.setor,
    required this.area,
    required this.veiculo,
    required this.kmAnterior,
    required this.kmAtual,
    required this.itens,
    required this.observacao,
    required this.dataCriacao,
    required this.temAvaria,
    this.categoriaAvaria,
    this.gravidadeAvaria,
    this.descricaoAvaria,
    this.solicitouTroca = false,
  });
}

class TrocaData {
  final String id;
  final String motorista;
  final String veiculoAntigo;
  final String veiculoNovo;
  final String checklistId;
  final DateTime data;
  String status;

  TrocaData({
    required this.id,
    required this.motorista,
    required this.veiculoAntigo,
    required this.veiculoNovo,
    required this.checklistId,
    required this.data,
    this.status = 'Pendente',
  });
}

class OcorrenciaData {
  final String id;
  final String motorista;
  final String placa;
  final String veiculo;
  final String categoria;
  final String gravidade;
  final String descricao;
  final String checklistId;
  final DateTime data;
  String status;

  OcorrenciaData({
    required this.id,
    required this.motorista,
    required this.placa,
    required this.veiculo,
    required this.categoria,
    required this.gravidade,
    required this.descricao,
    required this.checklistId,
    required this.data,
    this.status = 'Aberta',
  });
}

class AppDataService {
  static final AppDataService _instance = AppDataService._internal();
  factory AppDataService() => _instance;

  AppDataService._internal() {
    _initMockData();
  }

  // Dados do usuário logado
  final String currentUser = 'Roberto Alves';
  final String currentPlaca = 'ABC-1234';

  final List<String> unidades = [
    'São Paulo',
    'Campinas',
    'Guarulhos',
    'Santo André',
    'Ribeirão Preto',
  ];

  final List<String> setores = ['Comercial', 'Operacional'];

  final List<String> areas = [
    'Logística',
    'Distribuição',
    'Coleta',
    'Manutenção',
    'Administrativo',
  ];

  final List<String> veiculos = [
    'Volvo FH 540 (ABC-1234)',
    'Scania R450 (XYZ-9876)',
    'Mercedes Axor (DEF-5555)',
    'DAF XF (JKL-9012)',
    'Iveco Stralis (MNO-3456)',
  ];

  final List<ChecklistData> _checklists = [];
  final List<TrocaData> _trocas = [];
  final List<OcorrenciaData> _ocorrencias = [];

  List<ChecklistData> get checklists => List.unmodifiable(_checklists);
  List<TrocaData> get trocas => List.unmodifiable(_trocas);
  List<OcorrenciaData> get ocorrencias => List.unmodifiable(_ocorrencias);

  int _ckCounter = 1052;
  int _trCounter = 503;
  int _ocCounter = 9922;

  int get lastKm =>
      _checklists.isEmpty ? 154000 : _checklists.first.kmAtual;

  void _initMockData() {
    _checklists.addAll([
      ChecklistData(
        id: 'CK-1049',
        motorista: 'Roberto Alves',
        placa: 'ABC-1234',
        unidade: 'São Paulo',
        setor: 'Operacional',
        area: 'Logística',
        veiculo: 'Volvo FH 540 (ABC-1234)',
        kmAnterior: 154000,
        kmAtual: 154200,
        itens: {
          'Lâmpadas estão OK?': true,
          'Pneus estão OK?': true,
          'Estepe, triângulo e macaco estão OK?': true,
          'Nível do líquido de arrefecimento está OK?': true,
          'Óleo do motor está OK?': true,
          'Cartão combustível está OK?': true,
        },
        observacao: 'Sem observações.',
        dataCriacao: DateTime.now().subtract(const Duration(days: 1, hours: 2)),
        temAvaria: false,
        solicitouTroca: false,
      ),
      ChecklistData(
        id: 'CK-1048',
        motorista: 'Roberto Alves',
        placa: 'ABC-1234',
        unidade: 'São Paulo',
        setor: 'Operacional',
        area: 'Distribuição',
        veiculo: 'Volvo FH 540 (ABC-1234)',
        kmAnterior: 153800,
        kmAtual: 154000,
        itens: {
          'Lâmpadas estão OK?': true,
          'Pneus estão OK?': false,
          'Estepe, triângulo e macaco estão OK?': true,
          'Nível do líquido de arrefecimento está OK?': true,
          'Óleo do motor está OK?': true,
          'Cartão combustível está OK?': true,
        },
        observacao: 'Pneu traseiro esquerdo com desgaste acentuado.',
        dataCriacao: DateTime.now().subtract(const Duration(days: 3)),
        temAvaria: true,
        categoriaAvaria: 'Pneu',
        gravidadeAvaria: 'Média',
        descricaoAvaria: 'Desgaste excessivo no pneu traseiro esquerdo.',
        solicitouTroca: false,
      ),
    ]);
  }

  void addChecklist(ChecklistData data) => _checklists.insert(0, data);
  void addTroca(TrocaData data) => _trocas.insert(0, data);
  void addOcorrencia(OcorrenciaData data) => _ocorrencias.insert(0, data);

  String nextCkId() => 'CK-${++_ckCounter}';
  String nextTrId() => 'TR-${++_trCounter}';
  String nextOcId() => 'OCC-${++_ocCounter}';
}
