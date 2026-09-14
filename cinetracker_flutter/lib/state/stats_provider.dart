import 'package:flutter/foundation.dart';
import '../services/api/api_interface.dart';
import '../models/user_stats.dart';

/// Provider for CineTracker Analytics & Flagship Statistics ("Apple Health for Movies & TV").
class StatsProvider extends ChangeNotifier {
  final CineTrackerApiInterface api;
  final CineTrackerApiInterface? fallbackMockApi;
  CineTrackerApiInterface get _api => api;

  bool _isLoading = false;
  String? _errorMessage;
  UserStats? _stats;

  String _timeframe = 'all'; // 'all', 'year', 'month', 'week', 'custom'
  int? _selectedYear;
  String _media = 'all'; // 'all', 'movies', 'tv'

  StatsProvider({required this.api, this.fallbackMockApi});

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  UserStats? get stats => _stats;

  String get timeframe => _timeframe;
  int? get selectedYear => _selectedYear;
  String get media => _media;

  List<int> get availableYears => _stats?.availableYears ?? [DateTime.now().year];

  void clearData() {
    _stats = null;
    _errorMessage = null;
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadStats({bool refresh = false, bool isGuest = false}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    if (isGuest && fallbackMockApi != null) {
      try {
        _stats = await fallbackMockApi!.getStats(
          timeframe: _timeframe,
          year: _selectedYear,
          media: _media,
          refresh: refresh,
        );
        if (_selectedYear == null && _stats != null && _stats!.availableYears.isNotEmpty) {
          _selectedYear = _stats!.availableYears.first;
        }
        _isLoading = false;
        notifyListeners();
        return;
      } catch (_) {}
    }

    try {
      _stats = await _api.getStats(
        timeframe: _timeframe,
        year: _selectedYear,
        media: _media,
        refresh: refresh,
      );
      if (_selectedYear == null && _stats != null && _stats!.availableYears.isNotEmpty) {
        _selectedYear = _stats!.availableYears.first;
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Failed to load stats: $e';
      _isLoading = false;
      notifyListeners();
    }
  }

  void setTimeframe(String timeframe, {int? year}) {
    if (_timeframe == timeframe && _selectedYear == year) return;
    _timeframe = timeframe;
    if (year != null) _selectedYear = year;
    loadStats();
  }

  void setSelectedYear(int year) {
    if (_selectedYear == year) return;
    _selectedYear = year;
    _timeframe = 'year';
    loadStats();
  }

  void setMedia(String media) {
    if (_media == media) return;
    _media = media;
    loadStats();
  }

  Future<void> refresh() => loadStats(refresh: true);
}
