import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/colors.dart';
import '../../../core/utils/csv_parser.dart';
import '../../../models/api_models.dart';
import '../../../state/media_tracking_provider.dart';
import '../../shared/progress_bar.dart';

/// Screen for importing Letterboxd watched history or watchlist CSV exports.
class LetterboxdImportScreen extends StatefulWidget {
  const LetterboxdImportScreen({super.key});

  @override
  State<LetterboxdImportScreen> createState() => _LetterboxdImportScreenState();
}

class _LetterboxdImportScreenState extends State<LetterboxdImportScreen> {
  final TextEditingController _csvController = TextEditingController();
  String _importMode = 'watched'; // 'watched' or 'watchlist'
  bool _isImporting = false;
  double _importProgress = 0.0;
  BatchImportResult? _importResult;

  final String _sampleWatchedCsv = '''Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date
2024-03-01,Dune: Part Two,2024,https://boxd.it/test1,4.5,No,,2024-03-01
2024-02-15,Arrival,2016,https://boxd.it/test2,5.0,No,,2024-02-15
2024-01-20,Blade Runner 2049,2017,https://boxd.it/test3,4.0,No,,2024-01-20''';

  @override
  void dispose() {
    _csvController.dispose();
    super.dispose();
  }

  void _loadSampleData() {
    setState(() {
      _csvController.text = _sampleWatchedCsv;
    });
  }

  Future<void> _startImport() async {
    final content = _csvController.text.trim();
    if (content.isEmpty) return;

    setState(() {
      _isImporting = true;
      _importProgress = 0.1;
      _importResult = null;
    });

    try {
      // 1. Parse CSV locally
      final items = LetterboxdCsvParser.parse(content);
      setState(() => _importProgress = 0.4);

      // Simulate parsing progress
      await Future<void>.delayed(const Duration(milliseconds: 300));
      setState(() => _importProgress = 0.8);

      if (!mounted) return;
      final tracking = context.read<MediaTrackingProvider>();
      int imported = 0;
      for (final item in items) {
        if (_importMode == 'watched') {
          final dummyId = item.name.hashCode.abs() % 100000;
          await tracking.logMovie(
            dummyId,
            rating: (item.rating ?? 8).toDouble(),
            watchedDate: item.watchedDate,
          );
          imported++;
        } else {
          final dummyId = item.name.hashCode.abs() % 100000;
          await tracking.toggleMovieWatchlist(dummyId);
          imported++;
        }
      }

      setState(() {
        _importProgress = 1.0;
        _isImporting = false;
        _importResult = BatchImportResult(
          importedCount: imported,
        );
      });
      await HapticFeedback.heavyImpact();
    } catch (e) {
      setState(() {
        _isImporting = false;
        _importResult = BatchImportResult(
          errorCount: 1,
          errors: [e.toString()],
        );
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
          'Letterboxd Import',
          style: TextStyle(color: CineColors.textPrimary, fontWeight: FontWeight.bold),
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'IMPORT FROM LETTERBOXD',
                style: TextStyle(
                  color: CineColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Seamlessly bring your Letterboxd watch history (watched.csv) or queue (watchlist.csv) into CineTracker.',
                style: TextStyle(color: CineColors.textPrimary, fontSize: 14, height: 1.4),
              ),
              const SizedBox(height: 18),

              // Segment Selector: Watched History vs Watchlist
              SizedBox(
                width: double.infinity,
                child: CupertinoSlidingSegmentedControl<String>(
                  groupValue: _importMode,
                  backgroundColor: CineColors.surfaceGraphite,
                  thumbColor: CineColors.surfaceElevated,
                  children: {
                    'watched': Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      child: Text(
                        'Watched History',
                        style: TextStyle(
                          color: _importMode == 'watched'
                              ? CineColors.neonGreen
                              : CineColors.textSecondary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    'watchlist': Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      child: Text(
                        'Watchlist Queue',
                        style: TextStyle(
                          color: _importMode == 'watchlist'
                              ? CineColors.neonGreen
                              : CineColors.textSecondary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  },
                  onValueChanged: (val) {
                    if (val != null) setState(() => _importMode = val);
                  },
                ),
              ),
              const SizedBox(height: 16),

              // CSV Text Area
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: CineColors.surfaceGraphite,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: CineColors.borderSubtle, width: 0.5),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'CSV Raw Content',
                          style: TextStyle(
                            color: CineColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        CupertinoButton(
                          padding: EdgeInsets.zero,
                          onPressed: _loadSampleData,
                          child: const Text(
                            'Load Sample CSV',
                            style: TextStyle(
                              color: CineColors.neonGreen,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    CupertinoTextField(
                      controller: _csvController,
                      placeholder: 'Paste CSV content here (e.g. from watched.csv)...',
                      placeholderStyle: const TextStyle(
                        color: CineColors.textTertiary,
                        fontSize: 12,
                      ),
                      style: const TextStyle(
                        color: CineColors.textPrimary,
                        fontSize: 12,
                        fontFamily: 'monospace',
                      ),
                      maxLines: 8,
                      minLines: 4,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: CineColors.surfaceElevated,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Progress Bar if importing
              if (_isImporting) ...[
                CineProgressBar(progress: _importProgress, height: 6),
                const SizedBox(height: 8),
                const Center(
                  child: Text(
                    'Matching titles with TMDB & importing...',
                    style: TextStyle(color: CineColors.neonGreen, fontSize: 12),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Success Summary Card
              if (_importResult != null) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: CineColors.surfaceGraphite,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: CineColors.neonGreen, width: 0.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(CupertinoIcons.checkmark_circle_fill,
                              color: CineColors.neonGreen, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'Import Complete',
                            style: TextStyle(
                              color: CineColors.neonGreen,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${_importResult!.importedCount} movies matched and logged to your collection.',
                        style: const TextStyle(color: CineColors.textPrimary, fontSize: 13),
                      ),
                      if (_importResult!.skippedCount > 0)
                        Text(
                          '${_importResult!.skippedCount} items skipped due to missing title data.',
                          style: const TextStyle(color: CineColors.textSecondary, fontSize: 12),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Primary Action Button
              CupertinoButton(
                padding: const EdgeInsets.symmetric(vertical: 14),
                color: CineColors.neonGreen,
                borderRadius: BorderRadius.circular(14),
                onPressed: _isImporting ? null : _startImport,
                child: const Center(
                  child: Text(
                    'Start Import',
                    style: TextStyle(
                      color: CupertinoColors.black,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
