import type { CollectionEntry } from 'astro:content';

export type Entry = NewsletterEntry;

export type EntryTypes = 'newsletter';

export type NewsletterEntry = CollectionEntry<'newsletter'>;
