import 'package:flutter/material.dart';

class OccurrenceScreen extends StatefulWidget {
  const OccurrenceScreen({super.key});

  @override
  State<OccurrenceScreen> createState() => _OccurrenceScreenState();
}

class _OccurrenceScreenState extends State<OccurrenceScreen> {
  int _currentStep = 0;
  String _selectedCategory = 'Mecânica';
  String _selectedSeverity = 'Média';
  final _descriptionController = TextEditingController();

  final List<Map<String, dynamic>> _categories = [
    {'name': 'Mecânica', 'icon': Icons.settings_suggest},
    {'name': 'Elétrica', 'icon': Icons.bolt},
    {'name': 'Pneu', 'icon': Icons.tire_repair},
    {'name': 'Acidente', 'icon': Icons.warning_amber},
    {'name': 'Outros', 'icon': Icons.more_horiz},
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Reportar Ocorrência', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: theme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Custom Stepper Header
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Row(
              children: [
                _buildStepIndicator(0, 'Tipo'),
                _buildStepDivider(),
                _buildStepIndicator(1, 'Relato'),
                _buildStepDivider(),
                _buildStepIndicator(2, 'Provas'),
              ],
            ),
          ),
          
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: _buildCurrentStepView(),
            ),
          ),
          
          _buildBottomNav(),
        ],
      ),
    );
  }

  Widget _buildStepIndicator(int index, String label) {
    final isActive = _currentStep >= index;
    final isCurrent = _currentStep == index;
    
    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: isActive ? const Color(0xFF0F5AC4) : Colors.grey.shade300,
            shape: BoxShape.circle,
            border: isCurrent ? Border.all(color: const Color(0xFF7FC32E), width: 3) : null,
          ),
          child: Center(
            child: Text(
              '${index + 1}',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 10, fontWeight: isActive ? FontWeight.bold : FontWeight.normal)),
      ],
    );
  }

  Widget _buildStepDivider() => Expanded(child: Divider(color: Colors.grey.shade300, indent: 8, endIndent: 8));

  Widget _buildCurrentStepView() {
    switch (_currentStep) {
      case 0: return _buildCategorySelection();
      case 1: return _buildDescriptionAndSeverity();
      case 2: return _buildPhotoAndSubmit();
      default: return Container();
    }
  }

  Widget _buildCategorySelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Qual o tipo de problema?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
        const SizedBox(height: 8),
        const Text('Selecione a categoria que melhor descreve o incidente.', style: TextStyle(color: Colors.grey)),
        const SizedBox(height: 24),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.5,
          ),
          itemCount: _categories.length,
          itemBuilder: (context, index) {
            final cat = _categories[index];
            final isSelected = _selectedCategory == cat['name'];
            return GestureDetector(
              onTap: () => setState(() => _selectedCategory = cat['name']),
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF0F5AC4).withValues(alpha:0.1) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isSelected ? const Color(0xFF0F5AC4) : Colors.grey.shade200, width: 2),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(cat['icon'], color: isSelected ? const Color(0xFF0F5AC4) : Colors.grey, size: 32),
                    const SizedBox(height: 8),
                    Text(cat['name'], style: TextStyle(fontWeight: FontWeight.bold, color: isSelected ? const Color(0xFF0F5AC4) : Colors.black)),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildDescriptionAndSeverity() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Descreva o ocorrido', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
        const SizedBox(height: 16),
        TextField(
          controller: _descriptionController,
          maxLines: 5,
          decoration: InputDecoration(
            hintText: 'Ex: O motor começou a fazer um barulho estranho e o ponteiro de temperatura subiu...',
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade200)),
          ),
        ),
        const SizedBox(height: 32),
        const Text('Nível de Gravidade', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
        const SizedBox(height: 16),
        Row(
          children: ['Leve', 'Média', 'Grave'].map((s) {
            final isSelected = _selectedSeverity == s;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedSeverity = s),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected ? _getSeverityColor(s) : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isSelected ? _getSeverityColor(s) : Colors.grey.shade200),
                  ),
                  child: Center(
                    child: Text(s, style: TextStyle(fontWeight: FontWeight.bold, color: isSelected ? Colors.white : Colors.black)),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Color _getSeverityColor(String s) {
    if (s == 'Grave') return Colors.red;
    if (s == 'Média') return Colors.orange;
    return const Color(0xFF0F5AC4);
  }

  Widget _buildPhotoAndSubmit() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Evidências do Incidente', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
        const SizedBox(height: 8),
        const Text('Tire fotos do local ou do problema para facilitar o conserto.', style: TextStyle(color: Colors.grey)),
        const SizedBox(height: 24),
        Row(
          children: [
            _buildPhotoSlot(true),
            const SizedBox(width: 12),
            _buildPhotoSlot(false),
            const SizedBox(width: 12),
            _buildPhotoSlot(false),
          ],
        ),
        const SizedBox(height: 48),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            children: [
              const Icon(Icons.location_on, color: Color(0xFF0F5AC4)),
              const SizedBox(height: 8),
              const Text('Localização Detectada', style: TextStyle(fontWeight: FontWeight.bold)),
              const Text('Rodovia dos Bandeirantes, KM 42', style: TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPhotoSlot(bool hasContent) {
    return Expanded(
      child: Container(
        height: 100,
        decoration: BoxDecoration(
          color: hasContent ? Colors.grey.shade200 : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
        ),
        child: Icon(hasContent ? Icons.check_circle : Icons.camera_alt, color: hasContent ? Colors.green : Colors.grey),
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFEEEEEE))),
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _currentStep--),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('VOLTAR', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: () {
                if (_currentStep < 2) {
                  setState(() => _currentStep++);
                } else {
                  _showSuccessDialog();
                }
              },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: const Color(0xFF0F5AC4),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(_currentStep < 2 ? 'PRÓXIMO' : 'ENVIAR RELATO', style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, color: Color(0xFF7FC32E), size: 80),
            const SizedBox(height: 16),
            const Text('Ocorrência Enviada!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            const Text('Nossa equipe de monitoramento já foi notificada e está analisando o caso.', textAlign: TextAlign.center),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F5AC4),
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('ENTENDIDO', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
