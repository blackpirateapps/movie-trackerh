import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../state/auth_provider.dart';
import '../../../state/media_tracking_provider.dart';
import '../../../state/stats_provider.dart';
import '../../navigation/tab_scaffold.dart';
import 'signup_screen.dart';

/// Cupertino Login Screen: minimal, dark-mode first authentication.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController =
      TextEditingController(text: 'hi@sudipx.in');
  final TextEditingController _passwordController =
      TextEditingController(text: 'Sudip@21');
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Please enter email and password.');
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

    final success = await auth.login(email: email, password: password);

    if (mounted) {
      if (success) {
        unawaited(tracking.loadInitialData());
        unawaited(stats.loadStats(refresh: true));
        Navigator.of(context).pushReplacement<void, void>(
          CupertinoPageRoute<void>(builder: (ctx) => const CineTrackerTabScaffold()),
        );
      } else {
        setState(() {
          _errorMessage = auth.errorMessage ?? 'Invalid email or password.';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleGuest() async {
    final auth = context.read<AuthProvider>();
    final tracking = context.read<MediaTrackingProvider>();
    await HapticFeedback.selectionClick();
    auth.continueAsGuest();
    if (mounted) {
      unawaited(tracking.loadInitialData());
      Navigator.of(context).pushReplacement<void, void>(
        CupertinoPageRoute<void>(builder: (ctx) => const CineTrackerTabScaffold()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: CineColors.background,
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Brand Icon & Title
                Center(
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: CineColors.surfaceGraphite,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: CineColors.neonGreen, width: 1),
                    ),
                    child: const Icon(
                      CupertinoIcons.film,
                      color: CineColors.neonGreen,
                      size: 32,
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'CineTracker',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: CineColors.textPrimary,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Your watching life, tracked.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: CineColors.textSecondary,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 36),

                // Error alert banner if any
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

                // Form Inputs
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
                  placeholder: 'Password',
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
                const SizedBox(height: 20),

                // Login Button
                CupertinoButton(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  color: CineColors.neonGreen,
                  borderRadius: BorderRadius.circular(12),
                  onPressed: _isLoading ? null : _handleLogin,
                  child: _isLoading
                      ? const CupertinoActivityIndicator(color: CupertinoColors.black)
                      : const Text(
                          'Sign In',
                          style: TextStyle(
                            color: CupertinoColors.black,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
                const SizedBox(height: 14),

                // Continue as Guest Button
                CupertinoButton(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  color: CineColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(12),
                  onPressed: _handleGuest,
                  child: const Text(
                    'Explore as Guest',
                    style: TextStyle(
                      color: CineColors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Sign Up link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      "Don't have an account? ",
                      style: TextStyle(color: CineColors.textSecondary, fontSize: 13),
                    ),
                    CupertinoButton(
                      padding: EdgeInsets.zero,
                      onPressed: () {
                        Navigator.of(context).push<void>(
                          CupertinoPageRoute<void>(builder: (ctx) => const SignupScreen()),
                        );
                      },
                      child: const Text(
                        'Sign Up',
                        style: TextStyle(
                          color: CineColors.neonGreen,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
