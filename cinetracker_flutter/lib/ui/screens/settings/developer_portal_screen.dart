import 'dart:convert';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/colors.dart';
import '../../../models/api_key.dart';
import '../../../services/api/api_interface.dart';
import '../../../state/auth_provider.dart';
import 'package:provider/provider.dart';

/// Developer Portal Screen: API Keys & Interactive Live Console.
class DeveloperPortalScreen extends StatefulWidget {
  final CineTrackerApiInterface? api;
  const DeveloperPortalScreen({super.key, this.api});

  @override
  State<DeveloperPortalScreen> createState() => _DeveloperPortalScreenState();
}

class _DeveloperPortalScreenState extends State<DeveloperPortalScreen> {
  final List<ApiKey> _keys = [];
  bool _isLoadingKeys = true;
  String? _newRawKey;
  final TextEditingController _keyNameController = TextEditingController();

  // Interactive console state
  final String _selectedEndpoint = '/api/v1/export';
  String _consoleOutput = 'Tap "Send Request" to test endpoint live...';
  bool _isSendingRequest = false;

  CineTrackerApiInterface? _service;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_service == null) {
      _service = widget.api ?? context.read<AuthProvider>().api;
      _loadKeys();
    }
  }

  @override
  void dispose() {
    _keyNameController.dispose();
    super.dispose();
  }

  Future<void> _loadKeys() async {
    final service = _service;
    if (service == null) return;
    setState(() => _isLoadingKeys = true);
    try {
      final keys = await service.getApiKeys();
      if (mounted) {
        setState(() {
          _keys.clear();
          _keys.addAll(keys);
          _isLoadingKeys = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingKeys = false);
    }
  }

  Future<void> _createKey() async {
    final service = _service;
    if (service == null) return;
    final name = _keyNameController.text.trim().isNotEmpty
        ? _keyNameController.text.trim()
        : 'Default App Key';

    try {
      final res = await service.createApiKey(name: name);
      _keyNameController.clear();
      setState(() {
        _newRawKey = res.rawKey;
        _keys.insert(0, res.key);
      });
      await HapticFeedback.mediumImpact();
    } catch (_) {}
  }

  Future<void> _revokeKey(int keyId) async {
    final service = _service;
    if (service == null) return;
    await service.revokeApiKey(keyId);
    setState(() {
      _keys.removeWhere((k) => k.id == keyId);
    });
    await HapticFeedback.selectionClick();
  }

  Future<void> _sendConsoleRequest() async {
    final service = _service;
    if (service == null) return;
    setState(() {
      _isSendingRequest = true;
      _consoleOutput = 'Executing request to $_selectedEndpoint...';
    });

    await Future<void>.delayed(const Duration(milliseconds: 200));

    try {
      if (_selectedEndpoint == '/api/v1/export') {
        final res = await service.exportData();
        const encoder = JsonEncoder.withIndent('  ');
        setState(() {
          _consoleOutput = 'HTTP 200 OK\n\n${encoder.convert(res.data)}';
          _isSendingRequest = false;
        });
      } else {
        final res = await service.getDashboard();
        const encoder = JsonEncoder.withIndent('  ');
        setState(() {
          _consoleOutput = 'HTTP 200 OK\n\n${encoder.convert(res.toJson())}';
          _isSendingRequest = false;
        });
      }
    } catch (e) {
      setState(() {
        _consoleOutput = 'HTTP 500 Error: $e';
        _isSendingRequest = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: CineColors.background,
      navigationBar: const CupertinoNavigationBar(
        backgroundColor: CineColors.surfaceTranslucent,
        border: Border(bottom: BorderSide(color: CineColors.divider, width: 0.5)),
        previousPageTitle: 'Settings',
        middle: Text(
          'Developer Portal',
          style: TextStyle(color: CineColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // API KEYS SECTION
            const Text(
              'API KEYS & TOKENS',
              style: TextStyle(
                color: CineColors.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Generate personal API keys (cin_live_...) to integrate with scripts, widgets, or third-party clients.',
              style: TextStyle(color: CineColors.textPrimary, fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 14),

            // Raw Key Banner if just created
            if (_newRawKey != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: CineColors.surfaceGraphite,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: CineColors.neonGreen, width: 0.5),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'NEW API KEY CREATED (SAVE NOW):',
                      style: TextStyle(
                        color: CineColors.neonGreen,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _newRawKey!,
                      style: const TextStyle(
                        color: CineColors.textPrimary,
                        fontSize: 13,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Create Key Row
            Row(
              children: [
                Expanded(
                  child: CupertinoTextField(
                    controller: _keyNameController,
                    placeholder: 'Key Label (e.g. My Script)',
                    placeholderStyle: const TextStyle(color: CineColors.textTertiary, fontSize: 13),
                    style: const TextStyle(color: CineColors.textPrimary, fontSize: 13),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: CineColors.surfaceGraphite,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                CupertinoButton(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  color: CineColors.neonGreen,
                  borderRadius: BorderRadius.circular(10),
                  onPressed: _createKey,
                  child: const Text(
                    'Create',
                    style: TextStyle(
                      color: CupertinoColors.black,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Active Keys List
            if (_isLoadingKeys)
              const Center(child: CupertinoActivityIndicator(radius: 12))
            else if (_keys.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: CineColors.surfaceGraphite,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Text(
                    'No active API keys created.',
                    style: TextStyle(color: CineColors.textSecondary, fontSize: 13),
                  ),
                ),
              )
            else
              Column(
                children: _keys.map((k) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: CineColors.surfaceGraphite,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              k.name,
                              style: const TextStyle(
                                color: CineColors.textPrimary,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '${k.keyPrefix} · ${k.requestCount} requests',
                              style: const TextStyle(
                                color: CineColors.textSecondary,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                        CupertinoButton(
                          padding: EdgeInsets.zero,
                          onPressed: () => _revokeKey(k.id),
                          child: const Text(
                            'Revoke',
                            style: TextStyle(color: CineColors.destructive, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),

            const SizedBox(height: 28),

            // INTERACTIVE API CONSOLE
            const Text(
              'LIVE API TESTER CONSOLE',
              style: TextStyle(
                color: CineColors.textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 10),

            // Endpoint Selector
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: CineColors.surfaceGraphite,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                    ),
                    child: Text(
                      'GET $_selectedEndpoint',
                      style: const TextStyle(
                        color: CineColors.neonGreen,
                        fontSize: 13,
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                CupertinoButton(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  color: CineColors.surfaceElevated,
                  borderRadius: BorderRadius.circular(10),
                  onPressed: _isSendingRequest ? null : _sendConsoleRequest,
                  child: _isSendingRequest
                      ? const CupertinoActivityIndicator(radius: 10)
                      : const Text(
                          'Send',
                          style: TextStyle(color: CineColors.neonGreen, fontSize: 13),
                        ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Console Output Box
            Container(
              height: 200,
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: CupertinoColors.black,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: CineColors.borderSubtle, width: 0.5),
              ),
              child: SingleChildScrollView(
                child: Text(
                  _consoleOutput,
                  style: const TextStyle(
                    color: CineColors.textPrimary,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    height: 1.4,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
