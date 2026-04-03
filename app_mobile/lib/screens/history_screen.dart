import 'package:flutter/material.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    final history = [
      {'data': '31/03/2026', 'hora': '09:45', 'veiculo': 'Volvo FH 540', 'tipo': 'Troca de Veículo', 'status': 'Pendente'},
      {'data': '30/03/2026', 'hora': '07:20', 'veiculo': 'Volvo FH 540', 'tipo': 'Checklist Diário', 'status': 'Aprovado'},
      {'data': '29/03/2026', 'hora': '18:15', 'veiculo': 'Volvo FH 540', 'tipo': 'Checklist Diário', 'status': 'Aprovado'},
      {'data': '28/03/2026', 'hora': '06:45', 'veiculo': 'Volvo FH 540', 'tipo': 'Ocorrência (Pneu)', 'status': 'Concluido'},
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Meu Histórico', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: theme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: history.length,
        itemBuilder: (context, index) {
          final item = history[index];
          final isPending = item['status'] == 'Pendente';
          
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.grey.shade100),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isPending ? Colors.yellow.shade50 : Colors.green.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isPending ? Icons.timer : Icons.check_circle,
                    color: isPending ? Colors.orange : Colors.green,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['tipo']!, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                      Text('${item['data']} • ${item['hora']}', style: TextStyle(color: Colors.grey.shade500, fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(item['veiculo']!, style: TextStyle(color: theme.primaryColor, fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isPending ? Colors.yellow.shade100 : Colors.green.shade100,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    item['status']!,
                    style: TextStyle(
                      color: isPending ? Colors.orange.shade900 : Colors.green.shade900,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
