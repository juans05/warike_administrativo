import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge our custom radius/shadow tokens so className overrides replace them.
export const cn = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ['card', 'control'] }],
      shadow: [{ shadow: ['card', 'modal'] }],
    },
  },
});
