import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function DatabaseTest() {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [wordPairs, setWordPairs] = useState<Record<string, string | number | null>[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('word_pairs')
          .select('id, word_1, word_2, category, f0_mean_hz_david, f0_mean_hz_sarah, audio_1_path_sarah, audio_2_path_sarah, audio_1_path_david, audio_2_path_david')
          .limit(5);

        if (error) {
          setStatus('error');
          setError(error.message);
          return;
        }

        setWordPairs(data || []);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Database Connection Test</h1>

        {status === 'testing' && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            Testing connection...
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <strong>Success!</strong> Connected to Supabase and fetched {wordPairs.length} word pairs.
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Word Pairs from Database:</h2>
              <div className="space-y-3">
                {wordPairs.map((pair) => (
                  <div key={pair.id} className="border-b pb-4 mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-lg">{pair.word_1} / {pair.word_2}</p>
                        <p className="text-sm text-gray-600">{pair.category}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>David F0: {pair.f0_mean_hz_david} Hz</p>
                        <p>Sarah F0: {pair.f0_mean_hz_sarah} Hz</p>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-xs">
                      <p className={`font-mono ${pair.audio_1_path_sarah ? 'text-green-600' : 'text-red-600'}`}>
                        Sarah Audio 1: {pair.audio_1_path_sarah || '❌ MISSING'}
                      </p>
                      <p className={`font-mono ${pair.audio_2_path_sarah ? 'text-green-600' : 'text-red-600'}`}>
                        Sarah Audio 2: {pair.audio_2_path_sarah || '❌ MISSING'}
                      </p>
                      <p className={`font-mono ${pair.audio_1_path_david ? 'text-green-600' : 'text-red-600'}`}>
                        David Audio 1: {pair.audio_1_path_david || '❌ MISSING'}
                      </p>
                      <p className={`font-mono ${pair.audio_2_path_david ? 'text-green-600' : 'text-red-600'}`}>
                        David Audio 2: {pair.audio_2_path_david || '❌ MISSING'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
