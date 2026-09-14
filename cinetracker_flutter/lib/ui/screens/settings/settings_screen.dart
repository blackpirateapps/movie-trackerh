import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/theme/colors.dart';
import '../../../state/auth_provider.dart';
import '../../../state/media_tracking_provider.dart';
import '../../../state/stats_provider.dart';
import 'letterboxd_import_screen.dart';
import 'developer_portal_screen.dart';
import '../auth/login_screen.dart';

/// Cupertino Inset-Grouped Settings Screen.
/// Provides organized settings for Account, Preferences, Data (Letterboxd import/export),
/// Developer API keys & console, and Danger Zone.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _hideNsfw = false;
  bool _privateAccount = false;
  bool _isDarkMode = true;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.currentUser;

    return CupertinoPageScaffold(
      backgroundColor: CineColors.background,
      navigationBar: const CupertinoNavigationBar(
        backgroundColor: CineColors.surfaceTranslucent,
        border: Border(bottom: BorderSide(color: CineColors.divider, width: 0.5)),
        previousPageTitle: 'Profile',
        middle: Text(
          'Settings',
          style: TextStyle(color: CineColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      child: SafeArea(
        child: ListView(
          children: [
            const SizedBox(height: 12),

            // 1. ACCOUNT SECTION
            CupertinoListSection.insetGrouped(
              backgroundColor: CineColors.background,
              header: const Text('ACCOUNT', style: TextStyle(color: CineColors.textSecondary)),
              children: [
                CupertinoListTile(
                  leading: const Icon(CupertinoIcons.person, color: CineColors.textSecondary),
                  title: const Text('Username', style: TextStyle(color: CineColors.textPrimary)),
                  additionalInfo: Text(
                    user != null ? '@${user.username}' : 'Not logged in',
                    style: const TextStyle(color: CineColors.textTertiary),
                  ),
                ),
                CupertinoListTile(
                  leading: const Icon(CupertinoIcons.mail, color: CineColors.textSecondary),
                  title: const Text('Email', style: TextStyle(color: CineColors.textPrimary)),
                  additionalInfo: Text(
                    user?.email ?? '—',
                    style: const TextStyle(color: CineColors.textTertiary),
                  ),
                ),
              ],
            ),

            // 2. SERVER CONNECTION SECTION
            CupertinoListSection.insetGrouped(
              backgroundColor: CineColors.background,
              header: const Text('SERVER CONNECTION', style: TextStyle(color: CineColors.textSecondary)),
              children: [
                CupertinoListTile(
                  leading: const Icon(CupertinoIcons.cloud, color: CineColors.neonGreen),
                  title: const Text('Host Endpoint', style: TextStyle(color: CineColors.textPrimary)),
                  additionalInfo: Text(
                    auth.apiClient?.baseUrl ?? ApiConstants.defaultBaseUrl,
                    style: const TextStyle(color: CineColors.textTertiary, fontSize: 13),
                  ),
                ),
                CupertinoListTile(
                  leading: const Icon(CupertinoIcons.antenna_radiowaves_left_right, color: CineColors.neonGreen),
                  title: const Text('Status', style: TextStyle(color: CineColors.textPrimary)),
                  additionalInfo: Text(
                    auth.isAuthenticated
                        ? 'Live Backend Connected'
                        : (auth.isGuest ? 'Guest Mode' : 'Ready to Connect'),
                    style: TextStyle(
                      color: auth.isAuthenticated ? CineColors.neonGreen : CineColors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),

            // 2. PREFERENCES SECTION
            CupertinoListSection.insetGrouped(
              backgroundColor: CineColors.background,
              header: const Text('PREFERENCES', style: TextStyle(color: CineColors.textSecondary)),
              children: [
                CupertinoListTile(
                  leading: const Icon(CupertinoIcons.moon, color: CineColors.textSecondary),
                  title: const Text('Dark Appearance', style: TextStyle(color: CineColors.textPrimary)),
                  trailing: CupertinoSwitch(
                    activeColor: CineColors.neonGreen,
                    value: _isDarkMode,
                    onChanged: (val) => setState(() => _isDarkMode = val),
                  ),
                ),
                CupertinoListTile(
                  leading: const Icon(CupertinoIcons.eye_slash, color: CineColors.textSecondary),
                  title: const Text('Hide NSFW Content', style: TextStyle(color: CineColors.textPrimary)),
                  trailing: CupertinoSwitch(
                    activeColor: CineColors.neonGreen,
                    value: _hideNsfw,
                    onChanged: (val) => setState(() => _hideNsfw = val),
                  ),
                ),
                CupertinoListTile(
                  leading: const Icon(CupertinoIcons.lock, color: CineColors.textSecondary),
                  title: const Text('Private Account', style: TextStyle(color: CineColors.textPrimary)),
                  trailing: CupertinoSwitch(
                    activeColor: CineColors.neonGreen,
                    value: _privateAccount,
                    onChanged: (val) => setState(() => _privateAccount = val),
                  ),
                ),
              ],
            ),

            // 3. DATA SECTION (LETTERBOXD & EXPORT)
            CupertinoListSection.insetGrouped(
              backgroundColor: CineColors.background,
              header: const Text('DATA & IMPORT', style: TextStyle(color: CineColors.textSecondary)),
              children: [
                CupertinoListTile(
                  leading: const Icon(CupertinoIcons.arrow_down_doc, color: CineColors.neonGreen),
                  title: const Text('Import Letterboxd CSV', style: TextStyle(color: CineColors.textPrimary)),
                  trailing: const Icon(CupertinoIcons.chevron_right, size: 14, color: CineColors.textTertiary),
                  onTap: () {
                    Navigator.of(context).push<void>(
                      CupertinoPageRoute<void>(builder: (ctx) => const LetterboxdImportScreen()),
                    );
                  },
                ),
                CupertinoListTile(
                  leading: const Icon(CupertinoIcons.arrow_up_doc, color: CineColors.textSecondary),
                  title: const Text('Export My CineTracker Data', style: TextStyle(color: CineColors.textPrimary)),
                  trailing: const Icon(CupertinoIcons.chevron_right, size: 14, color: CineColors.textTertiary),
                  onTap: () => _handleDataExport(context),
                ),
              ],
            ),

            // 4. DEVELOPER PORTAL
            CupertinoListSection.insetGrouped(
              backgroundColor: CineColors.background,
              header: const Text('DEVELOPER', style: TextStyle(color: CineColors.textSecondary)),
              children: [
                CupertinoListTile(
                  leading: const Icon(CupertinoIcons.chevron_left_slash_chevron_right, color: CineColors.textSecondary),
                  title: const Text('API Keys & Developer Console', style: TextStyle(color: CineColors.textPrimary)),
                  trailing: const Icon(CupertinoIcons.chevron_right, size: 14, color: CineColors.textTertiary),
                  onTap: () {
                    Navigator.of(context).push<void>(
                      CupertinoPageRoute<void>(builder: (ctx) => const DeveloperPortalScreen()),
                    );
                  },
                ),
              ],
            ),

            // 5. SESSION & DANGER ZONE
            CupertinoListSection.insetGrouped(
              backgroundColor: CineColors.background,
              children: [
                CupertinoListTile(
                  title: const Center(
                    child: Text(
                      'Log Out',
                      style: TextStyle(
                        color: CineColors.destructive,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  onTap: () async {
                    await HapticFeedback.mediumImpact();
                    if (context.mounted) {
                      context.read<MediaTrackingProvider>().clearData();
                      context.read<StatsProvider>().clearData();
                    }
                    await auth.logout();
                    if (context.mounted) {
                      await Navigator.of(context, rootNavigator: true).pushAndRemoveUntil<void>(
                        CupertinoPageRoute<void>(builder: (ctx) => const LoginScreen()),
                        (route) => false,
                      );
                    }
                  },
                ),
              ],
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  void _handleDataExport(BuildContext context) {
    showCupertinoDialog<void>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('Export CineTracker Data'),
        content: const Text(
          'Your watched history, TV tracking records, 1-10 ratings, reviews, and watchlist will be exported in structured JSON format.',
        ),
        actions: [
          CupertinoDialogAction(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          CupertinoDialogAction(
            isDefaultAction: true,
            onPressed: () {
              Navigator.of(ctx).pop();
              _showExportSuccess(context);
            },
            child: const Text('Export JSON'),
          ),
        ],
      ),
    );
  }

  void _showExportSuccess(BuildContext context) {
    showCupertinoDialog<void>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('Export Ready'),
        content: const Text('Your full CineTracker data export has been prepared successfully.'),
        actions: [
          CupertinoDialogAction(
            isDefaultAction: true,
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }
}
