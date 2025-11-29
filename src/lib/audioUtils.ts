import { ActivityData } from "@/types/activity";

export function getAudioPath(activity: ActivityData, voiceId: string): string {
  if (!activity || !activity.audioSrc) {
    return '';
  }

  // CLOUD MODE: If it's a full URL (Supabase), return it directly.
  if (activity.audioSrc.startsWith('http')) {
    // If the URL is generic (e.g. points to male default), we might want to swap it 
    // based on voiceId if the structure allows. 
    // But for now, let's just return the source provided by the data hook.
    // Ideally, the HOOK should select the correct URL based on the voice context, 
    // not this utility.
    return activity.audioSrc;
  }

  // LEGACY LOCAL MODE:
  // Base path in public folder
  const basePath = "/hearing-rehab-audio";
  
  // Extract the filename from the hardcoded src
  const parts = activity.audioSrc.split('/');
  const filename = parts[parts.length - 1];
  
  if (!filename) return activity.audioSrc;

  // SCENARIOS: All voices available
  if (activity.id.startsWith('scenario')) {
    return `${basePath}/${voiceId}_audio/${filename}`;
  }

  // STORIES: Legacy fallback
  if (activity.id.startsWith('story')) {
    if (voiceId === 'david' || voiceId === 'marcus') {
      return `${basePath}/male_audio/${filename}`;
    } else {
      return `${basePath}/female_audio/${filename}`;
    }
  }

  // Default fallback
  return activity.audioSrc;
}
