import 'dart:async';
import 'package:flutter/foundation.dart';
import '../services/api/api_interface.dart';
import '../models/search_result.dart';

/// Provider managing global search, debounced input, unified movie/TV results, and recent history.
class SearchProvider extends ChangeNotifier {
  final CineTrackerApiInterface api;
  final CineTrackerApiInterface? fallbackMockApi;
  CineTrackerApiInterface get _api => api;

  String _query = '';
  String _typeFilter = 'all'; // 'all', 'movie', 'tv'
  List<SearchResult> _results = [];
  final List<String> _recentSearches = ['Severance', 'Dune', 'The Bear', 'Shogun'];
  bool _isSearching = false;
  String? _errorMessage;
  Timer? _debounceTimer;

  SearchProvider({required this.api, this.fallbackMockApi});

  String get query => _query;
  String get typeFilter => _typeFilter;
  List<SearchResult> get results => _results;
  List<String> get recentSearches => List.unmodifiable(_recentSearches);
  bool get isSearching => _isSearching;
  String? get errorMessage => _errorMessage;

  List<SearchResult> get filteredResults {
    if (_typeFilter == 'all') return _results;
    return _results.where((r) => r.mediaType == _typeFilter).toList();
  }

  void onQueryChanged(String newQuery) {
    _query = newQuery;
    _debounceTimer?.cancel();

    if (newQuery.trim().isEmpty) {
      _results = [];
      _isSearching = false;
      notifyListeners();
      return;
    }

    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      executeSearch(newQuery.trim());
    });
  }

  Future<void> executeSearch(String query) async {
    if (query.isEmpty) return;
    _isSearching = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.search(query, type: _typeFilter);
      _results = res;
      _isSearching = false;
      addRecentSearch(query);
      notifyListeners();
    } catch (e) {
      if (fallbackMockApi != null) {
        try {
          final res = await fallbackMockApi!.search(query, type: _typeFilter);
          _results = res;
          _isSearching = false;
          addRecentSearch(query);
          notifyListeners();
          return;
        } catch (_) {}
      }
      _errorMessage = 'Search failed: $e';
      _isSearching = false;
      notifyListeners();
    }
  }

  void setTypeFilter(String filter) {
    if (_typeFilter == filter) return;
    _typeFilter = filter;
    if (_query.trim().isNotEmpty) {
      executeSearch(_query.trim());
    } else {
      notifyListeners();
    }
  }

  void addRecentSearch(String term) {
    final clean = term.trim();
    if (clean.isEmpty) return;
    _recentSearches.remove(clean);
    _recentSearches.insert(0, clean);
    if (_recentSearches.length > 8) {
      _recentSearches.removeLast();
    }
  }

  void removeRecentSearch(String term) {
    _recentSearches.remove(term);
    notifyListeners();
  }

  void clearSearch() {
    _query = '';
    _results = [];
    _isSearching = false;
    _errorMessage = null;
    _debounceTimer?.cancel();
    notifyListeners();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }
}
