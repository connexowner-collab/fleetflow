import 'package:flutter/material.dart';

class ExchangeChecklistScreen extends StatefulWidget {
  const ExchangeChecklistScreen({super.key});

  @override
  State<ExchangeChecklistScreen> createState() => _ExchangeChecklistScreenState();
}

class _ExchangeChecklistScreenState extends State<ExchangeChecklistScreen> {
  int _currentStep = 0;

  // Questionários Meticuloso (Duplo)
  final Map<String, bool> _returnInspection = {
    'Lataria e Pintura do Antigo': true,
    'Higiene Interna da Cabine': true,
    'Tanque de Combustível (Nível)': true,
    'Hodômetro Informado (KM)': true,
  };

  final Map<String, bool> _receiveInspection = {
    'Lataria e Pintura do Novo': true,
    'Pneus e Calibragem': true,
    'Óleo e Água do Radiador': true,
    'Kit de Segurança (Macaco/Triângulo)': true,
    'Higiene e Vidros Internos': true,
  };

  void _nextStep() {
    if (_currentStep < 3) {
      setState(() => _currentStep++);
    } else {
      _showConfirmation();
    }
  }

  void _showConfirmation() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
        title: const Icon(Icons.swap_horizontal_circle, size: 64, color: Color(0xFF0F5AC4)),
        content: const Text(
          'SOLICITAÇÃO DE TROCA ENVIADA!\n\nAguarde a aprovação do Gestor no Painel Web para assumir o novo veículo oficialmente.',
          textAlign: TextAlign.center,
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
        ),
        actions: [
          Center(
            child: ElevatedButton(
              onPressed: () { Navigator.pop(context); Navigator.pop(context); },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7FC32E), padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15)),
              child: const Text('ENTENDIDO', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(title: const Text('Trocar Veículo'), backgroundColor: const Color(0xFF1E293B)),
      body: Stepper(
        type: StepperType.vertical,
        currentStep: _currentStep,
        onStepContinue: _nextStep,
        onStepCancel: () => _currentStep > 0 ? setState(() => _currentStep--) : Navigator.pop(context),
        controlsBuilder: (context, details) => Padding(
          padding: const EdgeInsets.only(top: 20),
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: details.onStepContinue,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _currentStep == 0 ? Colors.red : theme.primaryColor,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                  ),
                  child: Text(
                    _currentStep == 3 ? 'SOLICITAR TROCA' : 'PRÓXIMO PASSO',
                    style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1),
                  ),
                ),
              ),
            ],
          ),
        ),
        steps: [
          Step(
            title: const Text('Fase 1: Devolução do Atual (ABC-1234)', style: TextStyle(fontWeight: FontWeight.w900)),
            content: _buildGroup(_returnInspection, Colors.red.shade50),
            isActive: _currentStep >= 0,
          ),
          Step(
            title: const Text('Fase 2: Escolha do Novo Veículo', style: TextStyle(fontWeight: FontWeight.w900)),
            content: DropdownButtonFormField<String>(
              decoration: const InputDecoration(border: OutlineInputBorder(), labelText: 'Selecione o Veículo'),
              items: const [
                DropdownMenuItem(value: '1', child: Text('Scania R450 (XYZ-9876)')),
                DropdownMenuItem(value: '2', child: Text('Mercedes Axor (DEF-5555)')),
              ],
              onChanged: (v) {},
            ),
            isActive: _currentStep >= 1,
          ),
          Step(
            title: const Text('Fase 3: Inspeção do Novo (Meticuloso)', style: TextStyle(fontWeight: FontWeight.w900)),
            content: _buildGroup(_receiveInspection, Colors.green.shade50),
            isActive: _currentStep >= 2,
          ),
          Step(
            title: const Text('Fase 4: Assinatura e Fotos', style: TextStyle(fontWeight: FontWeight.w900)),
            content: Column(
              children: [
                const Text('Assine abaixo para validar a troca mútua:', style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
                Container(
                  height: 120,
                  width: double.infinity,
                  margin: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(15)),
                  child: const Center(child: Icon(Icons.gesture, color: Colors.grey, size: 32)),
                ),
                Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: const [Icon(Icons.camera_alt), Icon(Icons.camera_alt), Icon(Icons.camera_alt)]),
              ],
            ),
            isActive: _currentStep >= 3,
          ),
        ],
      ),
    );
  }

  Widget _buildGroup(Map<String, bool> items, Color bgColor) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(15)),
      child: Column(
        children: items.keys.map((key) {
          return SwitchListTile(
            title: Text(key, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            value: items[key]!,
            onChanged: (val) => setState(() => items[key] = val),
            activeColor: const Color(0xFF0F5AC4),
          );
        }).toList(),
      ),
    );
  }
}
