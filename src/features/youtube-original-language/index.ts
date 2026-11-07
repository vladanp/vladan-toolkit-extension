import type { Feature } from '@/lib/features';

export const youtubeOriginalLanguage = {
  id: 'youtube-original-language',
  name: 'Original audio and title',
  description:
    'Plays videos with their original audio instead of a dubbed track, and shows the original title on the video page instead of a translation.',
  group: 'YouTube',
  enabledByDefault: true,
} satisfies Feature;
