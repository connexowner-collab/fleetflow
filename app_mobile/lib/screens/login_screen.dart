import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _tenantController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  bool _loading = false;

  Future<void> _login() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Preencha e-mail e senha.'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _loading = true);

    try {
      await Supabase.instance.client.auth.signInWithPassword(email: email, password: password);
      if (mounted) Navigator.pushReplacementNamed(context, '/home');
    } on AuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // 1. Background Gradient Container
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF002D5B), // Deep Blue (Brand)
                  Color(0xFF0056B3), // Primary Blue (Brand)
                ],
              ),
            ),
          ),
          
          // 2. Decorative Shapes (Abstract Modernity)
          Positioned(
            top: -50,
            right: -50,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha:0.05),
                shape: BoxShape.circle,
              ),
            ),
          ),

          // 3. Main Content
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 30.0),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: constraints.maxHeight),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 40),
                        
                        // Logo Section
                        Center(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha:0.2),
                                  blurRadius: 20,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            child: SizedBox(
                              height: 80,
                              width: 80,
                              child: Image.asset('assets/logo_final.png', fit: BoxFit.contain),
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 24),
                        
                        const Text(
                          'FleetFlow',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 34,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -1.5,
                          ),
                        ),
                        
                        const Text(
                          'Gestão de Frota Segura',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                          ),
                        ),
                        
                        const SizedBox(height: 50),
                        
                        // Login Card
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(32),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha:0.1),
                                blurRadius: 40,
                                offset: const Offset(0, 20),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const Text(
                                'Acesso do Motorista',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF002D5B),
                                ),
                              ),
                              const SizedBox(height: 30),
                              
                              _buildModernTextField(
                                controller: _tenantController,
                                label: 'ID da Frota (Tenant)',
                                icon: Icons.domain,
                                color: const Color(0xFF0056B3),
                              ),
                              
                              const SizedBox(height: 16),
                              
                              _buildModernTextField(
                                controller: _emailController,
                                label: 'E-mail do Motorista',
                                icon: Icons.person_outline,
                                color: const Color(0xFF0056B3),
                                keyboardType: TextInputType.emailAddress,
                              ),
                              
                              const SizedBox(height: 16),
                              
                              _buildModernTextField(
                                controller: _passwordController,
                                label: 'Senha Pin',
                                icon: Icons.lock_outline,
                                color: const Color(0xFF0056B3),
                                isPassword: true,
                                obscureText: _obscurePassword,
                                onToggleVisibility: () => setState(() => _obscurePassword = !_obscurePassword),
                              ),
                              
                              const SizedBox(height: 12),
                              
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: () {},
                                  child: const Text(
                                    'Esqueceu a senha?',
                                    style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ),
                              
                              const SizedBox(height: 12),
                              
                              // Action Button
                              Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFF0056B3), Color(0xFF002D5B)],
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF0056B3).withValues(alpha:0.3),
                                      blurRadius: 15,
                                      offset: const Offset(0, 8),
                                    ),
                                  ],
                                ),
                                child: ElevatedButton(
                                  onPressed: _loading ? null : _login,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.transparent,
                                    foregroundColor: Colors.white,
                                    shadowColor: Colors.transparent,
                                    padding: const EdgeInsets.symmetric(vertical: 18),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  ),
                                  child: _loading
                                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                    : const Text(
                                    'LOGIN',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 40),
                        
                        // Biometric & Help
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _buildCircleAction(Icons.fingerprint, "Biometria"),
                            const SizedBox(width: 24),
                            _buildCircleAction(Icons.help_outline, "Suporte"),
                          ],
                        ),
                        
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModernTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    required Color color,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? onToggleVisibility,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.normal, fontSize: 13),
          prefixIcon: Icon(icon, color: color, size: 20),
          suffixIcon: isPassword 
            ? IconButton(
                icon: Icon(obscureText ? Icons.visibility_off : Icons.visibility, size: 18, color: Colors.grey),
                onPressed: onToggleVisibility,
              )
            : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
    );
  }

  Widget _buildCircleAction(IconData icon, String label) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha:0.1),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white24),
          ),
          child: Icon(icon, color: Colors.white, size: 24),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
