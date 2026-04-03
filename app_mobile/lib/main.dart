import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/checklist_screen.dart';
import 'screens/exchange_checklist_screen.dart';
import 'screens/history_screen.dart';
import 'screens/login_screen.dart';
import 'screens/occurrence_screen.dart';

void main() {
  runApp(const FleetFlowApp());
}

class FleetFlowApp extends StatelessWidget {
  const FleetFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FleetFlow',
      theme: ThemeData(
        primaryColor: const Color(0xFF0056B3),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0056B3),
          primary: const Color(0xFF0056B3),
          secondary: const Color(0xFF6AB023),
          surface: Colors.white,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        fontFamily: 'Roboto',
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F5AC4),
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0F5AC4),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ),
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/home': (context) => const HomeScreen(),
        '/checklist': (context) => const ChecklistScreen(),
        '/exchange': (context) => const ExchangeChecklistScreen(),
        '/history': (context) => const HistoryScreen(),
        '/occurrence': (context) => const OccurrenceScreen(),
      },
      debugShowCheckedModeBanner: false,
    );
  }
}
