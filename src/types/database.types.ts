/**
 * Types mirroring Supabase stimuli_catalog table and related views.
 *
 * IMPORTANT: Production column names differ from the original migration:
 *   - content_type (NOT type)
 *   - content_text (NOT text)
 *   - clinical_metadata (NOT tags) — JSONB column
 */

export interface StimulusCatalog {
  id: string;
  content_type: string;
  content_text: string;
  text_alt: string | null;
  erber_level: string | null;
  difficulty: number;
  target_phoneme: string | null;
  contrast_phoneme: string | null;
  phoneme_position: string | null;
  clinical_metadata: Record<string, unknown> | null;
  tier: string;
  drill_pack_id: string | null;
  prompt_text: string | null;
  response_text: string | null;
  created_at: string;
}

export interface DrillPackSummary {
  drill_pack_id: string;
  pack_name: string;
  contrast_type: string;
  target_phoneme: string;
  contrast_phoneme: string;
  total_pairs: number;
  min_difficulty: number;
  max_difficulty: number;
  tier: string;
}

export interface ConversationCategory {
  category: string;
  total_pairs: number;
  min_difficulty: number;
  max_difficulty: number;
  target_phonemes: string[] | null;
}

export interface EnvironmentalSoundCategory {
  category: string;
  total_sounds: number;
  safety_critical_count: number;
  min_difficulty: number;
  max_difficulty: number;
}

export type ContentType =
  | 'word' | 'sentence' | 'story' | 'scenario'
  | 'conversation' | 'environmental'
  | 'phoneme_drill' | 'story_question';
