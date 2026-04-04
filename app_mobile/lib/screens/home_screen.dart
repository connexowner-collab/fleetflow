import 'package:flutter/material.dart';
import '../services/supabase_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _nomeUsuario = 'Usuário';
  List<String> _telasPermitidas = ['checklist', 'troca', 'ocorrencia', 'historico'];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final svc = SupabaseService();
    final profile = await svc.getProfile();
    if (profile != null && mounted) {
      setState(() {
        _nomeUsuario = (profile['nome'] as String?) ?? 'Usuário';
        final telas = profile['telas_permitidas'];
        if (telas != null && telas is List && telas.isNotEmpty) {
          _telasPermitidas = List<String>.from(telas);
        }
        _loading = false;
      });
    } else {
      setState(() => _loading = false);
    }
  }

  bool _temAcesso(String tela) => _telasPermitidas.contains(tela);

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
            onPressed: () async {
              await SupabaseService().signOut();
              if (mounted) Navigator.pushReplacementNamed(context, '/login');
            },
            tooltip: 'Sair do Sistema',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: theme.primaryColor))
          : LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: constraints.maxHeight),
                    child: IntrinsicHeight(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _buildPremiumHeader(context),
                          Padding(
                            padding: const EdgeInsets.all(20.0),
                            child: Column(
                              children: [
                                if (_temAcesso('checklist')) ...[
                                  _buildActionButton(
                                    context,
                                    title: 'Checklist Diário',
                                    subtitle: 'Inspeção padrão de rotina',
                                    icon: Icons.assignment_turned_in,
                                    color: theme.primaryColor,
                                    onTap: () => Navigator.pushNamed(context, '/checklist'),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                                if (_temAcesso('troca')) ...[
                                  _buildActionButton(
                                    context,
                                    title: 'Troca de Veículo',
                                    subtitle: 'Devolução e Retirada (Minucioso)',
                                    icon: Icons.published_with_changes,
                                    color: theme.colorScheme.secondary,
                                    onTap: () => Navigator.pushNamed(context, '/exchange'),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                                if (_temAcesso('ocorrencia')) ...[
                                  _buildActionButton(
                                    context,
                                    title: 'Reportar Ocorrência',
                                    subtitle: 'Manutenção ou Avarias',
                                    icon: Icons.report_problem,
                                    color: Colors.orange,
                                    onTap: () => Navigator.pushNamed(context, '/occurrence'),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                                if (_temAcesso('historico'))
                                  _buildActionButton(
                                    context,
                                    title: 'Meu Histórico',
                                    subtitle: 'Consultar laudos passados',
                                    icon: Icons.history,
                                    color: Colors.blueGrey,
                                    onTap: () => Navigator.pushNamed(context, '/history'),
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
              },
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
                    width: 32, height: 32, padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    child: Image.asset('assets/logo_final.png', fit: BoxFit.contain),
                  ),
                  const SizedBox(width: 10),
                  const Text('FleetFlow', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -1)),
                ],
              ),
              IconButton(icon: const Icon(Icons.notifications_none, color: Colors.white), onPressed: () {}),
            ],
          ),
          const SizedBox(height: 30),
          Row(
            children: [
              Container(
                width: 60, height: 60,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: theme.colorScheme.secondary, width: 2),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(13),
                  child: Image.network(
                    'https://ui-avatars.com/api/?name=${Uri.encodeComponent(_nomeUsuario)}&background=0056B3&color=fff&bold=true',
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(Icons.person, color: Colors.grey, size: 30),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Motorista Responsável', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                  Text(_nomeUsuario, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
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
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
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
}
