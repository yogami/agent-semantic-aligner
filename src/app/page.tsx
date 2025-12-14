'use client';

import { useState } from 'react';

interface TranslationResult {
  originalMessage: string;
  translatedMessage: string;
  mappingsUsed: Array<{ sourceTerm: string; targetTerm: string; confidence: number }>;
  newMappingsCreated: Array<{ sourceTerm: string; targetTerm: string; confidence: number }>;
  overallConfidence: number;
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [sourceVocab, setSourceVocab] = useState('medical-v1');
  const [targetVocab, setTargetVocab] = useState('consumer-health');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sourceVocab, targetVocab }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-4">
            Agent Semantic Aligner
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Translation middleware for vocabulary gaps between AI agents using different ontologies
          </p>
        </header>

        <div className="max-w-3xl mx-auto bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Source Vocabulary
                </label>
                <input
                  type="text"
                  value={sourceVocab}
                  onChange={(e) => setSourceVocab(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="e.g., medical-v1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Vocabulary
                </label>
                <input
                  type="text"
                  value={targetVocab}
                  onChange={(e) => setTargetVocab(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="e.g., consumer-health"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Message to Translate
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                placeholder="Enter a message with domain-specific terminology..."
              />
            </div>

            <button
              onClick={handleTranslate}
              disabled={loading || !message.trim()}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Translating...
                </span>
              ) : (
                'Translate Message'
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <h3 className="text-sm font-medium text-green-400 mb-2">Translated Message</h3>
                  <p className="text-white text-lg">{result.translatedMessage}</p>
                  <div className="mt-2 text-sm text-slate-400">
                    Confidence: {(result.overallConfidence * 100).toFixed(1)}%
                  </div>
                </div>

                {result.mappingsUsed.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Mappings Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.mappingsUsed.map((m, i) => (
                        <span key={i} className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">
                          {m.sourceTerm} → {m.targetTerm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.newMappingsCreated.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">New Mappings Learned</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.newMappingsCreated.map((m, i) => (
                        <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                          {m.sourceTerm} → {m.targetTerm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="text-center mt-12 text-slate-500 text-sm">
          Multi-Agent Communication Suite • App 1 of 5
        </footer>
      </div>
    </main>
  );
}
