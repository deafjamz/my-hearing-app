import { useState, useMemo } from 'react';
import { useWordPairs } from '@/hooks/useActivityData';
import { useAudio } from '@/hooks/useAudio';
import { Play, AlertTriangle, CheckCircle, Search } from 'lucide-react';

export function QualityControl() {
  const { pairs, loading } = useWordPairs();
  const { play, isPlaying } = useAudio();
  const [filter, setFilter] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Flatten pairs into unique words for QC
  // We want to test unique words, but the DB structure is pairs.
  // Let's list pairs but allow playing audio for word 1 and word 2 separately.
  
  const filteredPairs = useMemo(() => {
    if (!filter) return pairs;
    const lower = filter.toLowerCase();
    return pairs.filter(p => 
      p.word_1.toLowerCase().includes(lower) || 
      p.word_2.toLowerCase().includes(lower)
    );
  }, [pairs, filter]);

  const handlePlay = (url: string, id: string) => {
    setPlayingId(id);
    play(url);
  };

  // Helper to extract voice specific URLs if we had them in the hook
  // Currently useWordPairs returns 'audio_1' and 'audio_2' which default to Male/Female or similar.
  // Wait, useWordPairs maps:
  // audio_1: p.audio_1_path
  // audio_2: p.audio_2_path
  // These point to specfic files generated.
  // To test ALL voices, we need to construct the URLs manually since the hook simplifies.
  
  const getVoiceUrl = (word: string, voice: string) => {
    // Reconstruct the standard path we settled on
    // URL: https://.../audio/words/{voice}/{slug}.mp3
    // We can get the base form the audio_1 link
    if (!pairs[0]?.audio_1) return '';
    const baseUrl = pairs[0].audio_1.split('/words/')[0];
    const slug = word.toLowerCase().replace(/[^a-z0-9]/g, ''); // Simple slugify match
    return `${baseUrl}/words/${voice}/${slug}.mp3`;
  };

  if (loading) return <div className="p-8 text-center">Loading Content Library...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen text-slate-900">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Content Quality Control</h1>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border shadow-sm">
          <Search size={20} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search words..." 
            className="outline-none bg-transparent"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-slate-500 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Word Pair</th>
              <th className="p-4 text-center">Sarah</th>
              <th className="p-4 text-center">Marcus</th>
              <th className="p-4 text-center">Emma</th>
              <th className="p-4 text-center">David</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPairs.map((pair) => (
              <tr key={pair.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-mono text-xs text-slate-400">{pair.id.slice(0,8)}</td>
                <td className="p-4 font-medium">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded">{pair.word_1}</span>
                    <span className="text-slate-300">/</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{pair.word_2}</span>
                  </div>
                </td>
                
                {['sarah', 'marcus', 'emma', 'david'].map((voice) => (
                  <td key={voice} className="p-4 text-center">
                    <div className="flex flex-col gap-2 items-center">
                      <button 
                        onClick={() => handlePlay(getVoiceUrl(pair.word_1, voice), `${pair.id}-${voice}-1`)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          playingId === `${pair.id}-${voice}-1` && isPlaying 
                            ? "bg-teal-500 text-white animate-pulse" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                      <button 
                        onClick={() => handlePlay(getVoiceUrl(pair.word_2, voice), `${pair.id}-${voice}-2`)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          playingId === `${pair.id}-${voice}-2` && isPlaying 
                            ? "bg-blue-600 text-white animate-pulse" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                    </div>
                  </td>
                ))}

                <td className="p-4 text-right">
                  <button className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Flag Issue">
                    <AlertTriangle size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
