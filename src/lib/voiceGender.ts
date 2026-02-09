/**
 * Voice-to-gender lookup for the 9-voice roster.
 * Used by progress logging to enrich trial metadata.
 */

const VOICE_GENDER: Record<string, 'male' | 'female'> = {
  sarah: 'female',
  emma: 'female',
  bill: 'male',
  michael: 'male',
  alice: 'female',
  daniel: 'male',
  matilda: 'female',
  charlie: 'male',
  aravind: 'male',
};

export function getVoiceGender(voiceId: string | undefined): 'male' | 'female' | undefined {
  if (!voiceId) return undefined;
  return VOICE_GENDER[voiceId.toLowerCase()];
}
