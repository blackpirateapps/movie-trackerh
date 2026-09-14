import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import 'core/theme/theme.dart';
import 'core/theme/colors.dart';
import 'state/auth_provider.dart';
import 'state/media_tracking_provider.dart';
import 'state/stats_provider.dart';
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

class _AppRootGate extends StatefulWidget {
  const _AppRootGate();

  @override
  State<_AppRootGate> createState() => _AppRootGateState();
}

class _AppRootGateState extends State<_AppRootGate> {
  bool _hasLoadedInitialData = false;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.isLoading &&
        auth.state == AuthState.authenticating &&
        auth.currentUser == null) {
      return const CupertinoPageScaffold(
        backgroundColor: CineColors.background,
        child: Center(
          child: CupertinoActivityIndicator(radius: 16),
        ),
      );
    }

    if (auth.isAuthenticated || auth.isGuest) {
      if (!_hasLoadedInitialData) {
        _hasLoadedInitialData = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          final tracking = context.read<MediaTrackingProvider>();
          final stats = context.read<StatsProvider>();
          if (tracking.dashboard == null && !tracking.isLoading) {
            tracking.loadInitialData(isGuest: auth.isGuest);
          }
          if (stats.stats == null && !stats.isLoading) {
            stats.loadStats(isGuest: auth.isGuest);
          }
        });
      }
      return const CineTrackerTabScaffold();
    }

    _hasLoadedInitialData = false;
    return const LoginScreen();
  }
}
