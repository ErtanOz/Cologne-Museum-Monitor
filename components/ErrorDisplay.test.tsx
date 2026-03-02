import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorDisplay } from './ErrorDisplay';

describe('ErrorDisplay', () => {
  it('invokes retry callback when Try Again is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorDisplay message="Fetch failed" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
