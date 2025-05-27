import { slug as githubSlug } from 'github-slugger';

export const slugify = (str: string) => githubSlug(str);
