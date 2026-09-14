import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../state/auth_provider.dart';
import '../../../state/media_tracking_provider.dart';
import '../../../state/stats_provider.dart';
import '../../navigation/tab_scaffold.dart';

/// Cupertino Sign Up Screen.
class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSignup() async {
    final username = _usernameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (username.isEmpty || email.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Please complete all fields.');
      return;
    }

    final auth = context.read<AuthProvider>();
    final tracking = context.read<MediaTrackingProvider>();
    final stats = context.read<StatsProvider>();

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    await HapticFeedback.selectionClick();

    final success = await auth.signup(
      username: username,
      email: email,
      password: password,
    );

    if (mounted) {
      if (success) {
        tracking.clearData();
        stats.clearData();
        try {
          await Future.wait([
            tracking.loadInitialData(isGuest: false),
            stats.loadStats(refresh: true, isGuest: false),
          ]);
        } catch (_) {}

        if (mounted) {
          Navigator.of(context).pushAndRemoveUntil<void>(
            CupertinoPageRoute<void>(builder: (ctx) => const CineTrackerTabScaffold()),
            (route) => false,
          );
        }
      } else {
        setState(() {
          _errorMessage = auth.errorMessage ?? 'Signup failed. Please try again.';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: CineColors.background,
      navigationBar: const CupertinoNavigationBar(
        backgroundColor: CineColors.surfaceTranslucent,
        border: Border(bottom: BorderSide(color: CineColors.divider, width: 0.5)),
        previousPageTitle: 'Sign In',
        middle: Text(
          'Create Account',
          style: TextStyle(color: CineColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Join CineTracker',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: CineColors.textPrimary,
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Start building your personal media collection.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: CineColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 28),

                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: CineColors.destructive.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: CineColors.destructive, width: 0.5),
                    ),
                    child: Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: CineColors.destructive, fontSize: 13),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                CupertinoTextField(
                  controller: _usernameController,
                  placeholder: 'Username',
                  placeholderStyle: const TextStyle(color: CineColors.textTertiary),
                  style: const TextStyle(color: CineColors.textPrimary),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: CineColors.surfaceGraphite,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                  ),
                ),
                const SizedBox(height: 12),
                CupertinoTextField(
                  controller: _emailController,
                  placeholder: 'Email address',
                  keyboardType: TextInputType.emailAddress,
                  placeholderStyle: const TextStyle(color: CineColors.textTertiary),
                  style: const TextStyle(color: CineColors.textPrimary),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: CineColors.surfaceGraphite,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                  ),
                ),
                const SizedBox(height: 12),
                CupertinoTextField(
                  controller: _passwordController,
                  placeholder: 'Password (min 6 characters)',
                  obscureText: true,
                  placeholderStyle: const TextStyle(color: CineColors.textTertiary),
                  style: const TextStyle(color: CineColors.textPrimary),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: CineColors.surfaceGraphite,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                  ),
                ),
                const SizedBox(height: 24),

                CupertinoButton(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  color: CineColors.neonGreen,
                  borderRadius: BorderRadius.circular(12),
                  onPressed: _isLoading ? null : _handleSignup,
                  child: _isLoading
                      ? const CupertinoActivityIndicator(color: CupertinoColors.black)
                      : const Text(
                          'Create Account',
                          style: TextStyle(
                            color: CupertinoColors.black,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
