import 'package:flutter/material.dart';

class ChecklistScreen extends StatefulWidget {
  const ChecklistScreen({super.key});

  @override
  State<ChecklistScreen> createState() => _ChecklistScreenState();
}

class _ChecklistScreenState extends State<ChecklistScreen> {
  int _currentStep = 0;
  final TextEditingController _kmController = TextEditingController();

  // Checklist Padrão
  final Map<String, bool> _standardItems = {
    'Nível de Óleo do Motor': true,
    'Líquido de Arrefecimento (Água)': true,
    'Calibragem e Estado dos Pneus': true,
    'Funcionamento de Luzes e Faróis': true,
    'Freio de Serviço e Estacionamento': true,
    'Documentação do Veículo (CRLV)': true,
    'Higiene Interna da Cabine': true,
  };

  void _nextStep() {
    if (_currentStep < 3) {
      setState(() => _currentStep++);
    } else {
      _finishChecklist();
    }
  }

  void _finishChecklist() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const AlertDialog(
        content: Row(children: [CircularProgressIndicator(), SizedBox(width: 20), Text('Sincronizando laudo...')]),
      ),
    );
    Future.delayed(const Duration(seconds: 2), () {
      Navigator.pop(context); // Close dialog
      Navigator.pop(context); // Close screen
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ Checklist diário concluído com sucesso!'), backgroundColor: Colors.green));
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(title: const Text('Inspeção de Rotina'), backgroundColor: theme.primaryColor, foregroundColor: Colors.white),
      body: Stepper(
        type: StepperType.horizontal,
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
                  style: ElevatedButton.styleFrom(backgroundColor: theme.primaryColor, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)),
                  child: Text(_currentStep == 3 ? 'FINALIZAR INSPEÇÃO' : 'PRÓXIMO'),
                ),
              ),
            ],
          ),
        ),
        steps: [
          Step(
            title: const Text('KM', style: TextStyle(fontSize: 10)),
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('HODÔMETRO ATUAL', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                const SizedBox(height: 10),
                TextField(
                  controller: _kmController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 2),
                  decoration: const InputDecoration(border: OutlineInputBorder(), prefixIcon: Icon(Icons.speed, size: 30), suffixText: 'KM'),
                ),
              ],
            ),
            isActive: _currentStep >= 0,
          ),
          Step(
            title: const Text('PADRÃO', style: TextStyle(fontSize: 10)),
            content: Column(
              children: _standardItems.keys.map((key) {
                return SwitchListTile(
                  title: Text(key, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  value: _standardItems[key]!,
                  onChanged: (val) => setState(() => _standardItems[key] = val),
                  activeColor: theme.colorScheme.secondary,
                );
              }).toList(),
            ),
            isActive: _currentStep >= 1,
          ),
          Step(
            title: const Text('FOTOS', style: TextStyle(fontSize: 10)),
            content: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildPhotoSlot('DIANTEIRA'),
                _buildPhotoSlot('TRASEIRA'),
              ],
            ),
            isActive: _currentStep >= 2,
          ),
          Step(
            title: const Text('TERMO', style: TextStyle(fontSize: 10)),
            content: Container(
              height: 150,
              width: double.infinity,
              decoration: BoxDecoration(color: Colors.grey.shade100, border: Border.all(color: Colors.grey.shade300, width: 2, style: BorderStyle.solid), borderRadius: BorderRadius.circular(15)),
              child: const Center(child: Text('ASSINATURA DIGITAL AQUI', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w900))),
            ),
            isActive: _currentStep >= 3,
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoSlot(String label) {
    return Column(
      children: [
        Container(width: 100, height: 100, decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(15)), child: const Icon(Icons.camera_alt, color: Colors.grey)),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900)),
      ],
    );
  }
}
