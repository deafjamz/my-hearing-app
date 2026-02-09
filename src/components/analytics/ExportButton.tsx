import { useState } from 'react';
import { Download, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/store/UserContext';
import { exportProgressCsv, exportPhonemeSummaryCsv } from '@/lib/exportCsv';
import type { PhonemePairStats } from '@/hooks/usePhonemeAnalytics';

/**
 * Premium-gated CSV export button for ProgressReport.
 * Two export options: full training data or phoneme summary.
 */
export function ExportButton({ phonemePairs }: { phonemePairs?: PhonemePairStats[] }) {
  const { user, hasAccess } = useUser();
  const canExport = hasAccess('Premium');
  const [exporting, setExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExportTraining = async () => {
    if (!user || !canExport) return;
    setExporting(true);
    try {
      const { data: rows } = await supabase
        .from('user_progress')
        .select('result, content_tags, response_time_ms, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (rows && rows.length > 0) {
        exportProgressCsv(rows as Array<{ result: string; content_tags: Record<string, unknown> | null; response_time_ms: number | null; created_at: string }>);
      }
    } finally {
      setExporting(false);
      setShowMenu(false);
    }
  };

  const handleExportPhonemes = () => {
    if (!phonemePairs || phonemePairs.length === 0) return;
    exportPhonemeSummaryCsv(phonemePairs);
    setShowMenu(false);
  };

  return (
    <div className="relative print:hidden">
      <button
        onClick={canExport ? () => setShowMenu(!showMenu) : undefined}
        disabled={!canExport || exporting}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
          canExport
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
        }`}
        title={canExport ? 'Export training data' : 'Premium feature'}
      >
        {canExport ? <Download size={16} /> : <Lock size={16} />}
        {exporting ? 'Exporting...' : 'Export'}
      </button>

      {showMenu && canExport && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-20 min-w-[200px]">
            <button
              onClick={handleExportTraining}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Export Training Data
            </button>
            {phonemePairs && phonemePairs.length > 0 && (
              <button
                onClick={handleExportPhonemes}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Export Sound Patterns
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
