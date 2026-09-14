import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import '../../core/theme/colors.dart';
import '../screens/home/home_screen.dart';
import '../screens/library/library_screen.dart';
import '../screens/watchlist/watchlist_screen.dart';
import '../screens/stats/stats_screen.dart';
import '../screens/profile/profile_screen.dart';

/// 5-Tab Cupertino Navigation Scaffold adhering strictly to iOS patterns.
/// Tabs: Home (0), Library (1), Watchlist (2), Stats (3), Profile (4).
class CineTrackerTabScaffold extends StatefulWidget {
  const CineTrackerTabScaffold({super.key});

  @override
  State<CineTrackerTabScaffold> createState() => _CineTrackerTabScaffoldState();
}

class _CineTrackerTabScaffoldState extends State<CineTrackerTabScaffold> {
  final CupertinoTabController _tabController = CupertinoTabController();

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _switchTab(int index) {
    HapticFeedback.selectionClick();
    _tabController.index = index;
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoTabScaffold(
      controller: _tabController,
      tabBar: CupertinoTabBar(
        backgroundColor: CineColors.surfaceTranslucent,
        activeColor: CineColors.neonGreen,
        inactiveColor: CineColors.textSecondary,
        border: const Border(
          top: BorderSide(color: CineColors.divider, width: 0.5),
        ),
        onTap: (index) => HapticFeedback.selectionClick(),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.house),
            activeIcon: Icon(CupertinoIcons.house_fill),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.square_stack_3d_up),
            activeIcon: Icon(CupertinoIcons.square_stack_3d_up_fill),
            label: 'Library',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.bookmark),
            activeIcon: Icon(CupertinoIcons.bookmark_fill),
            label: 'Watchlist',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.chart_bar),
            activeIcon: Icon(CupertinoIcons.chart_bar_fill),
            label: 'Stats',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.person_crop_circle),
            activeIcon: Icon(CupertinoIcons.person_crop_circle_fill),
            label: 'Profile',
          ),
        ],
      ),
      tabBuilder: (context, index) {
        return CupertinoTabView(
          builder: (context) {
            switch (index) {
              case 0:
                return HomeScreen(
                  onNavigateToWatchlist: () => _switchTab(2),
                  onNavigateToProfile: () => _switchTab(4),
                );
              case 1:
                return const LibraryScreen();
              case 2:
                return const WatchlistScreen();
              case 3:
                return const StatsScreen();
              case 4:
                return const ProfileScreen();
              default:
                return const HomeScreen();
            }
          },
        );
      },
    );
  }
}
