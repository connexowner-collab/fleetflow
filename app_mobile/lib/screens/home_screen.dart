import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: null,
        backgroundColor: theme.primaryColor,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
            tooltip: 'Sair do Sistema',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: IntrinsicHeight(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Premium Header with User/Car Info
                    _buildPremiumHeader(context),
                    
                    Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        children: [
                          _buildActionButton(
                            context, 
                            title: 'Checklist Diário', 
                            subtitle: 'Inspeção padrão de rotina', 
                            icon: Icons.assignment_turned_in, 
                            color: theme.primaryColor,
                            onTap: () => Navigator.pushNamed(context, '/checklist')
                          ),
                          
                          const SizedBox(height: 16),
                          
                          _buildActionButton(
                            context, 
                            title: 'Troca de Veículo', 
                            subtitle: 'Devolução e Retirada (Minucioso)', 
                            icon: Icons.published_with_changes, 
                            color: theme.colorScheme.secondary,
                            onTap: () => Navigator.pushNamed(context, '/exchange')
                          ),
                          
                          const SizedBox(height: 16),
                          
                          _buildActionButton(
                            context, 
                            title: 'Reportar Ocorrência', 
                            subtitle: 'Manutenção ou Avarias', 
                            icon: Icons.report_problem, 
                            color: Colors.orange,
                            onTap: () => Navigator.pushNamed(context, '/occurrence')
                          ),

                          const SizedBox(height: 16),

                          _buildActionButton(
                            context, 
                            title: 'Meu Histórico', 
                            subtitle: 'Consultar laudos passados', 
                            icon: Icons.history, 
                            color: Colors.blueGrey,
                            onTap: () => Navigator.pushNamed(context, '/history')
                          ),
                        ],
                      ),
                    ),
                    
                    const Spacer(),
                    
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Text(
                        '© 2026 FleetFlow SaaS Platform • v1.2.0',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey.shade400, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }
      ),
    );
  }

  Widget _buildPremiumHeader(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      padding: const EdgeInsets.only(top: 20, left: 30, right: 30, bottom: 40),
      decoration: BoxDecoration(
        color: theme.primaryColor,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(40),
          bottomRight: Radius.circular(40),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: Image.asset('assets/logo_final.png', fit: BoxFit.contain),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'FleetFlow',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -1,
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.notifications_none, color: Colors.white),
                onPressed: () {},
              ),
            ],
          ),
          const SizedBox(height: 30),
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: theme.colorScheme.secondary, width: 2),
                ),
                child: GestureDetector(
                  onTap: () => _showPhotoUploadDialog(context),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha:0.2),
                      shape: BoxShape.circle,
                    ),
                    child: ClipOval(
                      child: Image.network(
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.person, color: Colors.white, size: 40),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('Motorista Responsável', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                  Text('Roberto Alves', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 30),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha:0.15), blurRadius: 20, offset: const Offset(0, 10))
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: theme.primaryColor.withValues(alpha:0.1), borderRadius: BorderRadius.circular(15)),
                  child: Icon(Icons.local_shipping, color: theme.primaryColor),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('VEÍCULO ATRIBÍDO', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                      const Text('Volvo FH 540', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                      Text('Placa: ABC-1234', style: TextStyle(color: theme.primaryColor, fontWeight: FontWeight.w900, fontSize: 14)),
                    ],
                  ),
                ),
                Column(
                  children: [
                    const Icon(Icons.verified, color: Color(0xFF7FC32E), size: 24),
                    const Text('ATIVO', style: TextStyle(color: Color(0xFF7FC32E), fontSize: 10, fontWeight: FontWeight.w900)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(BuildContext context, {required String title, required String subtitle, required IconData icon, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha:0.04), blurRadius: 10, offset: const Offset(0, 4))
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: color.withValues(alpha:0.1), shape: BoxShape.circle),
              child: Icon(icon, size: 26, color: color),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(color: Colors.black45, fontSize: 12, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFFCBD5E1)),
          ],
        ),
      ),
    );
  }
  void _showPhotoUploadDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 24),
              decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
            ),
            const Text('Foto de Perfil', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF002D5B))),
            const SizedBox(height: 8),
            const Text('Selecione uma opção para atualizar sua foto.', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildUploadOption(Icons.camera_alt, 'Câmera', () => Navigator.pop(context)),
                _buildUploadOption(Icons.photo_library, 'Galeria', () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildUploadOption(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF0056B3).withValues(alpha:0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: const Color(0xFF0056B3), size: 30),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF002D5B))),
        ],
      ),
    );
  }
}
