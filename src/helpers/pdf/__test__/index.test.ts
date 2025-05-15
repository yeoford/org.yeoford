import { expect, describe, it } from 'vitest';
import { scanNewsletters } from '..';

describe('PDF Helper', () => {
  it('should be a test', async () => {
    await scanNewsletters();

    expect(true).toBe(true);
  });
});
