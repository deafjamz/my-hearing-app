import { ActivityData } from "@/types/activity";

export function getAudioPath(activity: ActivityData, voiceId: string): string {
  // Base path in public folder
  const basePath = "/hearing-rehab-audio";
  
  // Extract the filename from the hardcoded src
  // e.g., "/hearing-rehab-audio/female_audio/story_timid_teacup.mp3" -> "story_timid_teacup.mp3"
  const filename = activity.audioSrc.split('/').pop();
  
  if (!filename) return activity.audioSrc;

  // SCENARIOS: All voices available
  if (activity.id.startsWith('scenario')) {
    // Map voice ID to folder name
    // sarah -> sarah_audio
    // david -> david_audio
    return `${basePath}/${voiceId}_audio/${filename}`;
  }

  // STORIES: Only female_audio (Sarah/Emma) and male_audio (David/Marcus) available
  // This is a legacy fallback
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