import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:signature/signature.dart';
import '../services/app_data_service.dart';

class ChecklistScreen extends StatefulWidget {
  const ChecklistScreen({super.key});
  @override
  State<ChecklistScreen> createState() => _ChecklistScreenState();
}

class _ChecklistScreenState extends State<ChecklistScreen> {
  final _data = AppDataService();
  int _step = 0;
  bool _solicitarTroca = false;
  bool _temAvaria = false;

  // Step 1 - Placa
  final _placaCtrl = TextEditingController();
  String? _placaErro;

  // Step 2 - Dados
  final _nomeCtrl = TextEditingController();
  String? _unidade;
  String? _setor;
  String? _area;
  String? _veiculo;

  // Step 3 - KM & Itens
  final _kmCtrl = TextEditingController();
  final _obsCtrl = TextEditingController();
  String? _kmErro;
  final Map<String, bool> _itens = {
    'Lâmpadas estão OK?': true,
    'Pneus estão OK?': true,
    'Estepe, triângulo e macaco estão OK?': true,
    'Nível do líquido de arrefecimento está OK?': true,
    'Óleo do motor está OK?': true,
    'Cartão combustível está OK?': true,
  };

  // Step 4 - Fotos
  File? _fotoFrente;
  File? _fotoTraseira;
  final List<File> _fotosExtras = [];
  final _picker = ImagePicker();

  // Step 5 - Ocorrência
  String _catOcc = 'Mecânica';
  String _gravOcc = 'Média';
  final _descOccCtrl = TextEditingController();

  // Step 6 - Assinatura
  late final SignatureController _signCtrl;

  @override
  void initState() {
    super.initState();
    _nomeCtrl.text = _data.currentUser;
    _signCtrl = SignatureController(
      penStrokeWidth: 3,
      penColor: const Color(0xFF0F5AC4),
      exportBackgroundColor: Colors.white,
    );
  }

  @override
  void dispose() {
    _placaCtrl.dispose();
    _nomeCtrl.dispose();
    _kmCtrl.dispose();
    _obsCtrl.dispose();
    _descOccCtrl.dispose();
    _signCtrl.dispose();
    super.dispose();
  }

  int get _totalSteps => _temAvaria ? 6 : 5;

  void _next() {
    switch (_step) {
      case 0:
        if (!_validatePlaca()) return;
        setState(() => _step++);
      case 1:
        if (!_validateDados()) return;
        setState(() => _step++);
      case 2:
        if (!_validateKm()) return;
        setState(() => _step++);
      case 3:
        if (!_validateFotos()) return;
        _showAvariaDialog();
      case 4:
        if (_temAvaria) {
          setState(() => _step++);
        } else {
          _finalize();
        }
      default:
        _finalize();
    }
  }

  void _back() {
    if (_step == 0) { Navigator.pop(context); return; }
    setState(() {
      if (_step == 5 && !_temAvaria) { _step = 3; } else { _step--; }
    });
  }

  bool _validatePlaca() {
    final placa = _placaCtrl.text.trim().toUpperCase();
    if (placa.isEmpty) { setState(() => _placaErro = 'Informe a placa do ativo'); return false; }
    setState(() => _placaErro = null);
    if (placa != _data.currentPlaca.toUpperCase()) {
      _showTrocaDialog(placa);
      return false;
    }
    return true;
  }

  bool _validateDados() {
    if (_unidade == null || _setor == null || _area == null || _veiculo == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Preencha todos os campos obrigatórios'), backgroundColor: Colors.red),
      );
      return false;
    }
    return true;
  }

  bool _validateKm() {
    final str = _kmCtrl.text.trim().replaceAll('.', '');
    if (str.isEmpty) { setState(() => _kmErro = 'Informe o KM atual'); return false; }
    final km = int.tryParse(str);
    if (km == null) { setState(() => _kmErro = 'KM inválido'); return false; }
    if (km <= _data.lastKm) { setState(() => _kmErro = 'KM deve ser maior que ${_data.lastKm} km'); return false; }
    if (km - _data.lastKm > 50000) { setState(() => _kmErro = 'Diferença não pode ser superior a 50.000 km'); return false; }
    setState(() => _kmErro = null);
    return true;
  }

  bool _validateFotos() {
    if (_fotoFrente == null || _fotoTraseira == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Foto da FRENTE e TRASEIRA são obrigatórias'), backgroundColor: Colors.red),
      );
      return false;
    }
    return true;
  }

  void _showTrocaDialog(String placa) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Row(children: [
          Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.orange.shade100, shape: BoxShape.circle), child: Icon(Icons.swap_horiz, color: Colors.orange.shade800)),
          const SizedBox(width: 12),
          const Expanded(child: Text('Ativo Diferente', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900))),
        ]),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('O ativo $placa é diferente do vinculado ao seu usuário (${_data.currentPlaca}).', style: const TextStyle(fontSize: 13)),
          const SizedBox(height: 12),
          const Text('Deseja solicitar a troca junto com este checklist?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        ]),
        actions: [
          TextButton(onPressed: () { Navigator.pop(ctx); setState(() { _solicitarTroca = false; _step++; }); }, child: const Text('Não, apenas checklist')),
          ElevatedButton(
            onPressed: () { Navigator.pop(ctx); setState(() { _solicitarTroca = true; _step++; }); },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F5AC4), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Sim, solicitar troca'),
          ),
        ],
      ),
    );
  }

  void _showAvariaDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Row(children: [
          Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.red.shade100, shape: BoxShape.circle), child: Icon(Icons.warning_amber, color: Colors.red.shade800)),
          const SizedBox(width: 12),
          const Expanded(child: Text('Avaria no Ativo?', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900))),
        ]),
        content: const Text('O ativo possui alguma avaria a ser informada?', style: TextStyle(fontSize: 13)),
        actions: [
          TextButton(onPressed: () { Navigator.pop(ctx); setState(() { _temAvaria = false; _step = 5; }); }, child: const Text('Não')),
          ElevatedButton(
            onPressed: () { Navigator.pop(ctx); setState(() { _temAvaria = true; _step = 4; }); },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Sim, informar avaria'),
          ),
        ],
      ),
    );
  }

  void _finalize() {
    if (_signCtrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor, assine o termo'), backgroundColor: Colors.red),
      );
      return;
    }
    final km = int.parse(_kmCtrl.text.trim().replaceAll('.', ''));
    final ckId = _data.nextCkId();

    _data.addChecklist(ChecklistData(
      id: ckId,
      motorista: _nomeCtrl.text.trim(),
      placa: _placaCtrl.text.trim().toUpperCase(),
      unidade: _unidade!,
      setor: _setor!,
      area: _area!,
      veiculo: _veiculo!,
      kmAnterior: _data.lastKm,
      kmAtual: km,
      itens: Map.from(_itens),
      observacao: _obsCtrl.text.trim(),
      dataCriacao: DateTime.now(),
      temAvaria: _temAvaria,
      categoriaAvaria: _temAvaria ? _catOcc : null,
      gravidadeAvaria: _temAvaria ? _gravOcc : null,
      descricaoAvaria: _temAvaria ? _descOccCtrl.text.trim() : null,
      solicitouTroca: _solicitarTroca,
    ));

    if (_temAvaria) {
      _data.addOcorrencia(OcorrenciaData(
        id: _data.nextOcId(),
        motorista: _nomeCtrl.text.trim(),
        placa: _placaCtrl.text.trim().toUpperCase(),
        veiculo: _veiculo!,
        categoria: _catOcc,
        gravidade: _gravOcc,
        descricao: _descOccCtrl.text.trim(),
        checklistId: ckId,
        data: DateTime.now(),
      ));
    }

    if (_solicitarTroca) {
      _data.addTroca(TrocaData(
        id: _data.nextTrId(),
        motorista: _nomeCtrl.text.trim(),
        veiculoAntigo: 'Volvo FH 540 (${_data.currentPlaca})',
        veiculoNovo: _veiculo!,
        checklistId: ckId,
        data: DateTime.now(),
      ));
    }

    if (!mounted) return;
    Navigator.pop(context);
    String msg = 'Checklist $ckId gerado!';
    if (_temAvaria) msg += ' Ocorrência registrada.';
    if (_solicitarTroca) msg += ' Troca solicitada.';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: const Color(0xFF0F5AC4), duration: const Duration(seconds: 4)),
    );
  }

  Future<void> _pickPhoto(String slot) async {
    final src = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 20), decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
          Text('Foto: $slot', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
          const SizedBox(height: 24),
          Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
            _srcOpt(Icons.camera_alt, 'Câmera', const Color(0xFF0F5AC4), ImageSource.camera),
            _srcOpt(Icons.photo_library, 'Galeria', const Color(0xFF6AB023), ImageSource.gallery),
          ]),
          const SizedBox(height: 8),
        ]),
      ),
    );
    if (src == null || !mounted) return;
    try {
      final xf = await _picker.pickImage(source: src, imageQuality: 80);
      if (xf == null || !mounted) return;
      setState(() {
        final f = File(xf.path);
        if (slot == 'FRENTE') { _fotoFrente = f; }
        else if (slot == 'TRASEIRA') { _fotoTraseira = f; }
        else { _fotosExtras.add(f); }
      });
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Não foi possível acessar câmera/galeria')));
    }
  }

  Widget _srcOpt(IconData icon, String lbl, Color col, ImageSource src) => GestureDetector(
    onTap: () => Navigator.pop(context, src),
    child: Column(children: [
      Container(padding: const EdgeInsets.all(18), decoration: BoxDecoration(color: col.withValues(alpha: 0.1), shape: BoxShape.circle), child: Icon(icon, color: col, size: 28)),
      const SizedBox(height: 8),
      Text(lbl, style: const TextStyle(fontWeight: FontWeight.bold)),
    ]),
  );

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final lbls = ['Placa', 'Dados', 'Inspeção', 'Fotos', if (_temAvaria) 'Avaria', 'Assinatura'];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(title: const Text('Checklist Diário'), backgroundColor: theme.primaryColor, foregroundColor: Colors.white, elevation: 0, leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: _back)),
      body: Column(children: [
        Container(
          color: theme.primaryColor,
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: Column(children: [
            Row(mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_totalSteps, (i) => AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: i == _step ? 24 : 8, height: 8,
                decoration: BoxDecoration(color: i <= _step ? Colors.white : Colors.white30, borderRadius: BorderRadius.circular(4)),
              )),
            ),
            const SizedBox(height: 8),
            Text('Etapa ${_step + 1} de $_totalSteps  —  ${lbls.length > _step ? lbls[_step] : ""}',
              style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
          ]),
        ),
        Expanded(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            transitionBuilder: (c, a) => FadeTransition(opacity: a, child: SlideTransition(position: Tween<Offset>(begin: const Offset(0.05, 0), end: Offset.zero).animate(a), child: c)),
            child: KeyedSubtree(key: ValueKey(_step), child: _page()),
          ),
        ),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Colors.grey.shade200)), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -4))]),
          child: Row(children: [
            if (_step > 0) ...[
              Expanded(child: OutlinedButton(onPressed: _back, style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))), child: const Text('VOLTAR', style: TextStyle(fontWeight: FontWeight.bold)))),
              const SizedBox(width: 12),
            ],
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: _next,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _step == _totalSteps - 1 ? const Color(0xFF6AB023) : theme.primaryColor,
                  foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 0,
                ),
                child: Text(_step == _totalSteps - 1 ? 'FINALIZAR CHECKLIST' : 'PRÓXIMO', style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5)),
              ),
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _page() {
    switch (_step) {
      case 0: return _p1();
      case 1: return _p2();
      case 2: return _p3();
      case 3: return _p4();
      case 4: return _temAvaria ? _p5() : _p6();
      case 5: return _p6();
      default: return _p6();
    }
  }

  // PAGE 1 – Placa
  Widget _p1() => SingleChildScrollView(padding: const EdgeInsets.all(24), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const SizedBox(height: 16),
    Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: const Color(0xFF0F5AC4).withValues(alpha: 0.06), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFF0F5AC4).withValues(alpha: 0.2))),
      child: Row(children: [const Icon(Icons.info_outline, color: Color(0xFF0F5AC4)), const SizedBox(width: 12), Expanded(child: Text('Seu ativo vinculado: ${_data.currentPlaca}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F5AC4), fontSize: 13)))])),
    const SizedBox(height: 32),
    const Text('Placa do Ativo', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
    const SizedBox(height: 6),
    const Text('Informe a placa do veículo a ser inspecionado.', style: TextStyle(color: Colors.grey, fontSize: 13)),
    const SizedBox(height: 24),
    TextField(
      controller: _placaCtrl, textCapitalization: TextCapitalization.characters,
      inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9\-]')), LengthLimitingTextInputFormatter(8)],
      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 4), textAlign: TextAlign.center,
      decoration: InputDecoration(
        hintText: 'ABC-1234', hintStyle: const TextStyle(color: Colors.black26, fontSize: 24, letterSpacing: 4),
        errorText: _placaErro, filled: true, fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade300)),
        focusedBorder: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(16)), borderSide: BorderSide(color: Color(0xFF0F5AC4), width: 2)),
        prefixIcon: const Icon(Icons.directions_car, color: Color(0xFF0F5AC4)),
      ),
    ),
  ]));

  // PAGE 2 – Dados
  Widget _p2() => SingleChildScrollView(padding: const EdgeInsets.all(24), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Dados do Usuário', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
    const SizedBox(height: 4),
    const Text('Confirme seus dados para este checklist.', style: TextStyle(color: Colors.grey, fontSize: 13)),
    const SizedBox(height: 24),
    _fc('Nome Completo', Icons.person_outline, child: TextField(controller: _nomeCtrl, readOnly: true, style: const TextStyle(fontWeight: FontWeight.bold), decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.zero, isDense: true))),
    const SizedBox(height: 14),
    _fc('Em qual unidade você trabalha? *', Icons.location_city, child: DropdownButton<String>(value: _unidade, isExpanded: true, hint: const Text('Selecione...', style: TextStyle(color: Colors.grey, fontSize: 14)), underline: const SizedBox(), items: _data.unidades.map((u) => DropdownMenuItem(value: u, child: Text(u))).toList(), onChanged: (v) => setState(() => _unidade = v))),
    const SizedBox(height: 14),
    _fc('Setor *', Icons.business_center_outlined, child: DropdownButton<String>(value: _setor, isExpanded: true, hint: const Text('Selecione...', style: TextStyle(color: Colors.grey, fontSize: 14)), underline: const SizedBox(), items: _data.setores.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(), onChanged: (v) => setState(() => _setor = v))),
    const SizedBox(height: 14),
    _fc('Área *', Icons.grid_view, child: DropdownButton<String>(value: _area, isExpanded: true, hint: const Text('Selecione...', style: TextStyle(color: Colors.grey, fontSize: 14)), underline: const SizedBox(), items: _data.areas.map((a) => DropdownMenuItem(value: a, child: Text(a))).toList(), onChanged: (v) => setState(() => _area = v))),
    const SizedBox(height: 14),
    _fc('Qual veículo? *', Icons.local_shipping, child: DropdownButton<String>(value: _veiculo, isExpanded: true, hint: const Text('Selecione...', style: TextStyle(color: Colors.grey, fontSize: 14)), underline: const SizedBox(), items: _data.veiculos.map((v) => DropdownMenuItem(value: v, child: Text(v, overflow: TextOverflow.ellipsis))).toList(), onChanged: (v) => setState(() => _veiculo = v))),
    const SizedBox(height: 8),
  ]));

  Widget _fc(String lbl, IconData icon, {required Widget child}) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6, offset: const Offset(0, 2))]),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [Icon(icon, size: 14, color: const Color(0xFF0F5AC4)), const SizedBox(width: 6), Text(lbl, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 0.3))]),
      const SizedBox(height: 6), child,
    ]),
  );

  // PAGE 3 – Inspeção
  Widget _p3() => SingleChildScrollView(padding: const EdgeInsets.all(24), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Inspeção Técnica', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
    const SizedBox(height: 4),
    const Text('Informe o KM e verifique os itens abaixo.', style: TextStyle(color: Colors.grey, fontSize: 13)),
    const SizedBox(height: 24),
    Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
      child: Row(children: [const Icon(Icons.speed, color: Colors.grey), const SizedBox(width: 12), Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('KM ANTERIOR', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 0.5)),
        Text('${_data.lastKm} km', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
      ])])),
    const SizedBox(height: 16),
    TextField(
      controller: _kmCtrl, keyboardType: TextInputType.number,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
      decoration: InputDecoration(
        labelText: 'KM ATUAL *', labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.5),
        errorText: _kmErro, suffixText: 'km', prefixIcon: const Icon(Icons.add_road, color: Color(0xFF0F5AC4)),
        filled: true, fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade300)),
        focusedBorder: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(16)), borderSide: BorderSide(color: Color(0xFF0F5AC4), width: 2)),
      ),
    ),
    const SizedBox(height: 24),
    Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade200), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6)]),
      child: Column(children: [
        Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 8), child: Row(children: [const Icon(Icons.checklist_rtl, color: Color(0xFF0F5AC4), size: 20), const SizedBox(width: 8), const Text('ITENS DE VERIFICAÇÃO', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 0.5))])),
        const Divider(height: 1),
        ..._itens.keys.map((k) => SwitchListTile(
          dense: true,
          title: Text(k, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
          subtitle: Text(_itens[k]! ? 'Conforme ✓' : 'Não conforme ✗', style: TextStyle(fontSize: 11, color: _itens[k]! ? Colors.green : Colors.red)),
          value: _itens[k]!, activeThumbColor: const Color(0xFF6AB023),
          onChanged: (v) => setState(() => _itens[k] = v),
        )),
      ]),
    ),
    const SizedBox(height: 16),
    TextField(
      controller: _obsCtrl, maxLines: 3,
      decoration: InputDecoration(
        labelText: 'OBSERVAÇÕES (opcional)', labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.5),
        hintText: 'Alguma observação relevante...',
        filled: true, fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade300)),
        focusedBorder: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(16)), borderSide: BorderSide(color: Color(0xFF0F5AC4), width: 2)),
      ),
    ),
    const SizedBox(height: 8),
  ]));

  // PAGE 4 – Fotos
  Widget _p4() => SingleChildScrollView(padding: const EdgeInsets.all(24), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Evidências Fotográficas', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
    const SizedBox(height: 4),
    const Text('Frente e Traseira são obrigatórias.', style: TextStyle(color: Colors.grey, fontSize: 13)),
    const SizedBox(height: 24),
    Row(children: [Expanded(child: _pSlot('FRENTE', _fotoFrente, req: true)), const SizedBox(width: 16), Expanded(child: _pSlot('TRASEIRA', _fotoTraseira, req: true))]),
    const SizedBox(height: 24),
    const Text('FOTOS ADICIONAIS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 0.5)),
    const SizedBox(height: 12),
    Wrap(spacing: 12, runSpacing: 12, children: [
      ..._fotosExtras.asMap().entries.map((e) => Stack(children: [
        Container(width: 80, height: 80, decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), image: DecorationImage(image: FileImage(e.value), fit: BoxFit.cover))),
        Positioned(top: 4, right: 4, child: GestureDetector(onTap: () => setState(() => _fotosExtras.removeAt(e.key)), child: Container(padding: const EdgeInsets.all(2), decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle), child: const Icon(Icons.close, color: Colors.white, size: 14)))),
      ])),
      GestureDetector(
        onTap: () => _pickPhoto('EXTRA'),
        child: Container(width: 80, height: 80, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFF0F5AC4).withValues(alpha: 0.4))),
          child: const Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.add_a_photo, color: Color(0xFF0F5AC4), size: 24), SizedBox(height: 4), Text('Adicionar', style: TextStyle(fontSize: 9, color: Color(0xFF0F5AC4), fontWeight: FontWeight.bold))])),
      ),
    ]),
    const SizedBox(height: 8),
  ]));

  Widget _pSlot(String lbl, File? file, {required bool req}) => GestureDetector(
    onTap: () => _pickPhoto(lbl),
    child: Container(
      height: 160,
      decoration: BoxDecoration(color: file != null ? null : Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: file != null ? const Color(0xFF6AB023) : (req ? Colors.red.shade300 : Colors.grey.shade300), width: 2), image: file != null ? DecorationImage(image: FileImage(file), fit: BoxFit.cover) : null),
      child: file == null ? Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(Icons.camera_alt, size: 36, color: req ? Colors.red.shade300 : Colors.grey.shade400),
        const SizedBox(height: 8),
        Text(lbl, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: req ? Colors.red.shade400 : Colors.grey, letterSpacing: 0.5)),
        if (req) const Text('OBRIGATÓRIO', style: TextStyle(fontSize: 9, color: Colors.red, fontWeight: FontWeight.w900)),
      ]) : Align(alignment: Alignment.bottomCenter, child: Container(
        width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(color: Colors.black54, borderRadius: const BorderRadius.vertical(bottom: Radius.circular(18))),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.check_circle, color: Color(0xFF6AB023), size: 14), const SizedBox(width: 4), Text(lbl, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900))]),
      )),
    ),
  );

  // PAGE 5 – Ocorrência
  Widget _p5() {
    final cats = ['Mecânica', 'Elétrica', 'Pneu', 'Acidente', 'Outros'];
    final icons = {'Mecânica': Icons.settings_suggest, 'Elétrica': Icons.bolt, 'Pneu': Icons.tire_repair, 'Acidente': Icons.warning_amber, 'Outros': Icons.more_horiz};
    return SingleChildScrollView(padding: const EdgeInsets.all(24), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.red.shade200)), child: Row(children: [Icon(Icons.warning_amber, color: Colors.red.shade600), const SizedBox(width: 12), const Expanded(child: Text('Registre os detalhes da avaria.', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)))])),
      const SizedBox(height: 24),
      const Text('Tipo de Avaria', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
      const SizedBox(height: 12),
      GridView.count(crossAxisCount: 3, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 1.1,
        children: cats.map((c) { final sel = _catOcc == c; return GestureDetector(onTap: () => setState(() => _catOcc = c), child: Container(
          decoration: BoxDecoration(color: sel ? const Color(0xFF0F5AC4).withValues(alpha: 0.1) : Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: sel ? const Color(0xFF0F5AC4) : Colors.grey.shade200, width: 2)),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(icons[c], color: sel ? const Color(0xFF0F5AC4) : Colors.grey, size: 28), const SizedBox(height: 6), Text(c, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: sel ? const Color(0xFF0F5AC4) : Colors.black))]),
        )); }).toList(),
      ),
      const SizedBox(height: 24),
      const Text('Nível de Gravidade', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
      const SizedBox(height: 12),
      Row(children: ['Leve', 'Média', 'Grave'].map((s) { final sel = _gravOcc == s; final col = s == 'Grave' ? Colors.red : s == 'Média' ? Colors.orange : const Color(0xFF0F5AC4);
        return Expanded(child: GestureDetector(onTap: () => setState(() => _gravOcc = s), child: Container(margin: const EdgeInsets.symmetric(horizontal: 4), padding: const EdgeInsets.symmetric(vertical: 14), decoration: BoxDecoration(color: sel ? col : Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: sel ? col : Colors.grey.shade200, width: 2)), child: Center(child: Text(s, style: TextStyle(fontWeight: FontWeight.bold, color: sel ? Colors.white : Colors.black))))));
      }).toList()),
      const SizedBox(height: 24),
      TextField(controller: _descOccCtrl, maxLines: 4, decoration: InputDecoration(
        labelText: 'DESCRIÇÃO DA AVARIA *', labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 0.5),
        hintText: 'Descreva detalhadamente o problema...',
        filled: true, fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade300)),
        focusedBorder: const OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(16)), borderSide: BorderSide(color: Color(0xFF0F5AC4), width: 2)),
      )),
      const SizedBox(height: 8),
    ]));
  }

  // PAGE 6 – Assinatura
  Widget _p6() => SingleChildScrollView(padding: const EdgeInsets.all(24), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Termo de Responsabilidade', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
    const SizedBox(height: 6),
    const Text('Confirme que as informações prestadas são verdadeiras.', style: TextStyle(color: Colors.grey, fontSize: 13)),
    const SizedBox(height: 24),
    Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade200), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6)]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('RESUMO', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 0.5)),
        const SizedBox(height: 12),
        _ir(Icons.directions_car, 'Placa', _placaCtrl.text.toUpperCase()),
        _ir(Icons.person, 'Motorista', _nomeCtrl.text),
        _ir(Icons.speed, 'KM', '${_kmCtrl.text} km'),
        _ir(Icons.location_on, 'Unidade', _unidade ?? '-'),
        _ir(Icons.business, 'Setor / Área', '${_setor ?? '-'} • ${_area ?? '-'}'),
        if (_temAvaria) _ir(Icons.warning, 'Avaria', '$_catOcc • $_gravOcc', color: Colors.red),
        if (_solicitarTroca) _ir(Icons.swap_horiz, 'Troca', 'Solicitada — aguarda aprovação', color: Colors.orange),
      ]),
    ),
    const SizedBox(height: 24),
    const Text('ASSINATURA DIGITAL', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 0.5)),
    const SizedBox(height: 12),
    Container(height: 200, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFF0F5AC4).withValues(alpha: 0.5), width: 2)),
      child: ClipRRect(borderRadius: BorderRadius.circular(18), child: Signature(controller: _signCtrl, backgroundColor: Colors.white))),
    const SizedBox(height: 10),
    Center(child: TextButton.icon(onPressed: () => _signCtrl.clear(), icon: const Icon(Icons.refresh, size: 16), label: const Text('Limpar assinatura'), style: TextButton.styleFrom(foregroundColor: Colors.grey))),
    const SizedBox(height: 8),
  ]));

  Widget _ir(IconData icon, String lbl, String val, {Color? color}) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(children: [
      Icon(icon, size: 15, color: color ?? Colors.grey), const SizedBox(width: 8),
      Text('$lbl: ', style: const TextStyle(fontSize: 12, color: Colors.grey)),
      Expanded(child: Text(val, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color ?? const Color(0xFF1E293B)), overflow: TextOverflow.ellipsis)),
    ]),
  );
}
