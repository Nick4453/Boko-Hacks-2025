import { useState } from "react";

export default function CodeScanner() {
  const [code, setCode] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<
    Array<{
      severity: "low" | "medium" | "high";
      description: string;
      line: number;
    }>
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/codescan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze code");
      }

      setVulnerabilities(data.vulnerabilities);

      if (data.vulnerabilities.length === 0) {
        setError("No vulnerabilities found in the code!");
      }
    } catch (error) {
      console.error("Error analyzing code:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      setVulnerabilities([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[80vh] overflow-hidden">
      <div className="flex-shrink-0 text-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Code Vulnerability Scanner
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Paste your code below and let our AI analyze it for potential security
          vulnerabilities
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 mb-4">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-full min-h-[200px] w-full rounded-lg border-gray-300 bg-white py-3 px-4 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm resize-none"
            placeholder="Paste your code here..."
          />
        </div>

        <div className="flex-shrink-0 flex justify-center mb-4">
          <button
            type="submit"
            disabled={isAnalyzing || !code.trim()}
            className={`
              inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm
              ${
                isAnalyzing || !code.trim()
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }
            `}
          >
            {isAnalyzing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Analyzing...
              </>
            ) : (
              "Analyze Code"
            )}
          </button>
        </div>
      </form>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-blue-700 text-sm">{error}</p>
          </div>
        )}

        {vulnerabilities.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Analysis Results
            </h3>
            <div className="space-y-3">
              {vulnerabilities.map((vulnerability, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    vulnerability.severity === "high"
                      ? "border-red-200 bg-red-50"
                      : vulnerability.severity === "medium"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${
                        vulnerability.severity === "high"
                          ? "bg-red-100 text-red-800"
                          : vulnerability.severity === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {vulnerability.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-600">
                      Line {vulnerability.line}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-gray-700">
                    {vulnerability.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
