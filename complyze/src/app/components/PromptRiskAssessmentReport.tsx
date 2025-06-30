import React, { useEffect, useState } from 'react';

interface PromptRiskAssessmentData {
  id: string;
  original_redacted_prompt: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  type_of_data_redacted: string;
  framework_tags: string[];
  smart_rewrite: string | null;
  timestamp: string;
  user_id: string;
  browser_app_context: string;
}

function PromptRiskAssessmentReport() {
  const [reportData, setReportData] = useState<PromptRiskAssessmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/reports/prompt-risk-assessment');
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setReportData(data.reportData);
      } catch (err: any) {
        console.error('Failed to fetch prompt risk assessment report:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div className="text-lg font-semibold text-slate-700 mb-2">Loading Report...</div>
        <div className="text-sm text-slate-500">Fetching and decrypting prompt data.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 shadow p-8 text-center text-red-800">
        <p className="font-bold mb-2">Error loading report:</p>
        <p>{error}</p>
        <p className="text-sm text-red-600 mt-2">Please try again later or check server logs.</p>
      </div>
    );
  }

  if (reportData.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow p-8 text-center">
        <div className="text-lg font-semibold text-slate-700 mb-2">No Data Available</div>
        <div className="text-sm text-slate-500">No prompt events found to generate this report.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Prompt Risk Assessment Report</h2>
      <p className="text-gray-600">Snapshot of each intercepted or submitted prompt, including risk levels and redaction details.</p>

      <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt (Redacted)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Redacted Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frameworks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Context</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.map((prompt) => (
              <tr key={prompt.id}>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">{prompt.original_redacted_prompt}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    prompt.risk_level === 'critical' ? 'bg-red-100 text-red-800' :
                    prompt.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                    prompt.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {prompt.risk_level.charAt(0).toUpperCase() + prompt.risk_level.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">{prompt.type_of_data_redacted}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {prompt.framework_tags.length > 0 ? 
                    prompt.framework_tags.map(tag => (
                      <span key={tag} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full mr-1 mb-1">
                        {tag}
                      </span>
                    ))
                  : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(prompt.timestamp).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prompt.browser_app_context}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Future: Add Smart Rewrite section if smart_rewrite is present */}
      {/* For now, it's included in original_redacted_prompt, but can be a separate column/section */}
    </div>
  );
}

export default PromptRiskAssessmentReport; 