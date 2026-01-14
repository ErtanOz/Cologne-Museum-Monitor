import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MuseumData, MuseumHistory } from './types';
import { fetchMuseumData } from './services/geminiService';
import { Sidebar } from './components/Sidebar';
import { MetricCards } from './components/MetricCards';
import { MuseumTable } from './components/MuseumTable';
import { RankingChart, TrendChart } from './components/Charts';
import { WordCloud } from './components/WordCloud';
import { SentimentAnalysis } from './components/SentimentAnalysis';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { ErrorDisplay } from './components/ErrorDisplay';

// Initial list of museums to track
const TARGET_MUSEUMS = [
  "Museum Ludwig",
  "Römisch-Germanisches Museum",
  "Schokoladenmuseum Köln",
  "Wallraf-Richartz-Museum",
  "Museum für Angewandte Kunst Köln",
  "NS-Dokumentationszentrum",
  "Duftmuseum im Farina-Haus",
  "Kölnisches Stadtmuseum",
  "Museum Schnütgen",
  "Odysseum",
  "Rautenstrauch-Joest-Museum",
  "Kolumba",
  "Cologne Cathedral Treasury"
];

const LOADING_MESSAGES = [
  "Initializing Gemini Maps Grounding...",
  "Searching for Cologne museums...",
  "Fetching ratings and review counts...",
  "Analyzing review sentiment...",
  "Extracting key topics for word clouds...",
  "Aggregating dashboard metrics..."
];

const App: React.FC = () => {
  const [data, setData] = useState<MuseumData[]>([]);
  const [history, setHistory] = useState<MuseumHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [timeRange, setTimeRange] = useState<string>('1y');

  const [selectedMuseumId, setSelectedMuseumId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Cycle through loading messages to give user feedback on the process
    let msgIndex = 0;
    setLoadingMessage(LOADING_MESSAGES[0]);
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[msgIndex]);
    }, 2500);

    try {
      // In a real app, we might check localStorage first for today's cache
      // For this demo, we fetch live from Gemini
      const fetchedData = await fetchMuseumData(TARGET_MUSEUMS);

      // Sort by rating descending by default
      const sortedData = fetchedData.sort((a, b) => b.rating - a.rating);

      setData(sortedData);
      setLastUpdated(new Date());

      // Simulate history for the trend chart since we can't actually scrape daily in this session
      // In a real deployed app, this would come from a database.
      const mockHistory = generateMockHistory(sortedData);
      setHistory(mockHistory);

      if (sortedData.length > 0) {
        setSelectedMuseumId(sortedData[0].name);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred fetching data.');
    } finally {
      clearInterval(msgInterval);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Filter data (Main Table)
  const filteredData = data.filter(m => m.rating >= minRatingFilter);

  // Filter History Data based on Time Range
  const filteredHistory = useMemo(() => {
    const now = new Date();
    let cutoffDate = new Date();

    switch (timeRange) {
      case '1m':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
      default:
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return history.filter(h => new Date(h.date) >= cutoffDate);
  }, [history, timeRange]);

  // Get top 3 for metrics
  const top3 = [...data].sort((a, b) => b.rating - a.rating).slice(0, 3);

  // Prepare data for details view
  const selectedMuseum = data.find(m => m.name === selectedMuseumId);
  // Filter history for specific museum AND time range
  const selectedMuseumHistory = filteredHistory.filter(h => h.name === selectedMuseumId);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        minRating={minRatingFilter}
        onFilterChange={setMinRatingFilter}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onRefresh={loadData}
        loading={loading}
      />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <Header lastUpdated={lastUpdated} title="Cologne Museum Monitor" />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {error && <ErrorDisplay message={error} onRetry={loadData} />}

          {loading && !data.length ? (
            <Loader message={loadingMessage} />
          ) : (
            <>
              <MetricCards topMuseums={top3} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Ranking */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Current Ratings Ranking</h3>
                  <div className="flex-1 min-h-[300px]">
                    <RankingChart data={filteredData} />
                  </div>
                </div>

                {/* Right Column: Selected Museum Details */}
                <div className="flex flex-col gap-6">
                  {/* Trend Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">
                        History: {selectedMuseumId || 'Select a Museum'}
                      </h3>
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        Last {timeRange === '1y' ? '1 Year' : timeRange === '6m' ? '6 Months' : timeRange === '3m' ? '3 Months' : '1 Month'}
                      </span>
                    </div>
                    <div className="h-48">
                      <TrendChart data={selectedMuseumHistory} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sentiment Analysis */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Sentiment Analysis
                      </h3>
                      <div className="min-h-[120px] flex items-center justify-center">
                        {selectedMuseum ? (
                          <SentimentAnalysis sentiment={selectedMuseum.sentiment} />
                        ) : (
                          <span className="text-slate-400 text-sm">Select a museum</span>
                        )}
                      </div>
                    </div>

                    {/* Word Cloud */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        Review Topics
                      </h3>
                      <div className="flex-1 min-h-[120px] bg-slate-50 rounded-lg border border-slate-100">
                        {selectedMuseum ? (
                          <WordCloud keywords={selectedMuseum.keywords} />
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-400 text-sm">Select a museum</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800">Museum Data Table</h3>
                </div>
                <MuseumTable
                  data={filteredData}
                  onSelect={setSelectedMuseumId}
                  selectedId={selectedMuseumId}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// Helper to generate realistic-looking mock history based on the *actual* current data
function generateMockHistory(currentData: MuseumData[]): MuseumHistory[] {
  const history: MuseumHistory[] = [];
  const today = new Date();

  currentData.forEach(museum => {
    // Generate 12 months of history
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      const variance = Math.random() * 0.4 - 0.2;
      const reviewVariance = Math.floor(Math.random() * 200);

      let pastRating = museum.rating + variance;
      pastRating = Math.max(1, Math.min(5, pastRating));

      const pastReviews = Math.max(0, museum.reviewCount - (i * reviewVariance));

      history.push({
        name: museum.name,
        date: date.toISOString().split('T')[0],
        rating: Number(pastRating.toFixed(1)),
        reviewCount: pastReviews
      });
    }
  });
  return history;
}

export default App;