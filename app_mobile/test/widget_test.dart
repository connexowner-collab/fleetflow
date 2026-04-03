import 'package:flutter_test/flutter_test.dart';
import 'package:app_mobile/main.dart';

void main() {
  testWidgets('FleetFlow smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const FleetFlowApp());
    expect(find.text('FleetFlow'), findsWidgets);
  });
}
