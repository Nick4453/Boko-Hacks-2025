import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface NewsArticle {
  title: string;
  content: string;
  date: string;
  readMoreUrl: string;
  imageUrl: string;
}

interface NewsResponse {
  success: boolean;
  category: string;
  data: NewsArticle[];
}

const CATEGORIES = [
  { id: "business", name: "Business" },
  { id: "technology", name: "Technology" },
  { id: "world", name: "World" },
];

export default function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState("business");
  const [showSettings, setShowSettings] = useState(false);
  const [articlesPerPage, setArticlesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const { isAuthenticated } = useAuth();

  // Developer options state
  const [showDevTools, setShowDevTools] = useState(false);
  const [filterJson, setFilterJson] = useState("{}");

  useEffect(() => {
    if (isAuthenticated) {
      fetchNews(currentCategory);
    }
  }, [currentCategory, isAuthenticated]);

  const fetchNews = async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = `http://localhost:5000/api/news/fetch?category=${category}`;

      // Add filter parameter if dev tools are enabled
      if (showDevTools) {
        try {
          const filterObj = JSON.parse(filterJson);
          url += `&filter=${encodeURIComponent(JSON.stringify(filterObj))}`;
        } catch (e) {
          console.error("Invalid filter JSON:", e);
        }
      }

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }

      const data: NewsResponse = await response.json();

      if (data.success) {
        setArticles(data.data.slice(0, articlesPerPage));
      } else {
        throw new Error("Failed to load news");
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setError(error instanceof Error ? error.message : "Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((article) =>
    searchTerm
      ? article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">
          Please log in to access the news system.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-none p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Company News Feed</h1>
          <p className="text-gray-600">
            Stay updated with the latest industry news
          </p>
        </div>

        {/* Search and Settings Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Settings ⚙️
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-6">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setCurrentCategory(category.id)}
              className={`px-4 py-2 rounded-md transition-colors ${
                currentCategory === category.id
                  ? "bg-[#501214] text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* News Content - Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-600">
              Loading news feed...
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-md">
              {error}
            </div>
          ) : filteredArticles.length > 0 ? (
            filteredArticles.map((article, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-3">{article.title}</h2>
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <p className="text-gray-600 mb-4">{article.content}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {new Date(article.date).toLocaleDateString()}
                  </span>
                  <a
                    href={article.readMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#501214] hover:underline"
                  >
                    Read more
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-600">
              No news articles found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          News provided by Public API • Updated{" "}
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">News Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <label className="block mb-2">Articles Per Page</label>
              <select
                value={articlesPerPage}
                onChange={(e) => setArticlesPerPage(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                <option value={5}>5 articles</option>
                <option value={10}>10 articles</option>
                <option value={15}>15 articles</option>
              </select>
            </div>

            {/* Developer Options */}
            <div className="mb-4">
              <button
                onClick={() => setShowDevTools(!showDevTools)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {showDevTools
                  ? "Hide Developer Options"
                  : "Show Developer Options"}
              </button>

              {showDevTools && (
                <div className="mt-4">
                  <label className="block mb-2">API Filters (JSON)</label>
                  <textarea
                    value={filterJson}
                    onChange={(e) => setFilterJson(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder='{"showInternal": true}'
                  />
                  <button
                    onClick={() => fetchNews(currentCategory)}
                    className="mt-2 px-3 py-1 bg-gray-800 text-white rounded-md text-sm"
                  >
                    Apply Filters
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowSettings(false);
                  fetchNews(currentCategory);
                }}
                className="px-4 py-2 bg-[#501214] text-white rounded-md hover:bg-[#3d0e0f]"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
