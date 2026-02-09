import type { PhonemePairStats } from '@/hooks/usePhonemeAnalytics';

interface ProgressRow {
  result: string;
  content_tags: Record<string, unknown> | null;
  response_time_ms: number | null;
  created_at: string;
}

/**
 * Export raw training data as CSV (browser-side download).
 * No new dependencies — uses Blob + hidden anchor pattern.
 */
export function exportProgressCsv(rows: ProgressRow[]): void {
  const headers = [
    'Date',
    'Result',
    'Activity',
    'Word',
    'Distractor',
    'Position',
    'Voice',
    'Noise',
    'Trial #',
    'Replays',
    'Response Time (ms)',
  ];

  const csvRows = rows.map((row) => {
    const tags = row.content_tags || {};
    return [
      row.created_at,
      row.result,
      (tags.activityType as string) || '',
      (tags.word as string) || '',
      (tags.distractorWord as string) || '',
      (tags.position as string) || '',
      (tags.voiceGender as string) || '',
      tags.noiseEnabled ? 'yes' : 'no',
      tags.trialNumber != null ? String(tags.trialNumber) : '',
      tags.replayCount != null ? String(tags.replayCount) : '',
      row.response_time_ms != null ? String(row.response_time_ms) : '',
    ];
  });

  download(headers, csvRows, 'soundsteps-training-data.csv');
}

/**
 * Export phoneme pair summary as CSV.
 */
export function exportPhonemeSummaryCsv(pairs: PhonemePairStats[]): void {
  const headers = ['Target', 'Contrast', 'Trials', 'Correct', 'Accuracy %', 'Confused As Target', 'Confused As Contrast'];

  const csvRows = pairs.map((p) => [
    p.target,
    p.contrast,
    String(p.trials),
    String(p.correct),
    String(p.accuracy),
    String(p.confusedAsTarget),
    String(p.confusedAsContrast),
  ]);

  download(headers, csvRows, 'soundsteps-sound-patterns.csv');
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function download(headers: string[], rows: string[][], filename: string): void {
  const lines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ];
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
