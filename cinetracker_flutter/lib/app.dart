import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import 'core/theme/theme.dart';
import 'core/theme/colors.dart';
import 'state/auth_provider.dart';
import 'ui/navigation/tab_scaffold.dart';
import 'ui/screens/auth/login_screen.dart';

/// Root Cupertino Application for CineTracker iOS.
class CineTrackerApp extends StatelessWidget {
  const CineTrackerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const CupertinoApp(
      title: 'CineTracker',
      theme: CineTheme.darkTheme,
      debugShowCheckedModeBanner: false,
      home: _AppRootGate(),
    );
  }
}

class _AppRootGate extends StatelessWidget {
  const _AppRootGate();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.isLoading && auth.state == AuthState.authenticating && auth.currentUser == null) {
      return const CupertinoPageScaffold(
        backgroundColor: CineColors.background,
        child: Center(
          child: CupertinoActivityIndicator(radius: 16),
        ),
      );
    }

    if (auth.isAuthenticated || auth.isGuest) {
      return const CineTrackerTabScaffold();
    }

    return const LoginScreen();
  }
}
