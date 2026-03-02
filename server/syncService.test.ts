/** @vitest-environment node */

import { describe, expect, it } from 'vitest';
import { shouldSkipByThrottle } from './syncService';

describe('sync throttle policy', () => {
  it('skips page-load refresh when sync happened recently', () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(shouldSkipByThrottle(recent, 'page_load', false)).toBe(true);
  });

  it('does not skip manual refresh', () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(shouldSkipByThrottle(recent, 'manual', false)).toBe(false);
  });

  it('does not skip when force flag is enabled', () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(shouldSkipByThrottle(recent, 'page_load', true)).toBe(false);
  });
});
