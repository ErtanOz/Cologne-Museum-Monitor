import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MuseumTable } from './MuseumTable';
import { MuseumData } from '../types';

const museumBase = {
  reviewsSample: [],
  source: 'synthetic_engine' as const,
  fetchedAt: '2026-03-02T10:00:00.000Z',
};

const museums: MuseumData[] = [
  {
    ...museumBase,
    name: 'Museum Ludwig',
    placeId: 'place-1',
    rating: 4.7,
    reviewCount: 10000,
    address: 'Heinrich-Boell-Platz',
    url: 'https://maps.google.com',
    keywords: [{ text: 'modern art', value: 8 }],
    sentiment: { positive: 80, neutral: 15, negative: 5 },
  },
  {
    ...museumBase,
    name: 'Wallraf-Richartz-Museum',
    placeId: 'place-2',
    rating: 4.3,
    reviewCount: 4300,
    address: 'Obenmarspforten',
    url: 'https://maps.google.com',
    keywords: [{ text: 'classical art', value: 7 }],
    sentiment: { positive: 76, neutral: 18, negative: 6 },
  },
  {
    ...museumBase,
    name: 'Kolumba',
    placeId: 'place-3',
    rating: 4.8,
    reviewCount: 980,
    address: 'Kolumbastrasse',
    url: 'https://maps.google.com',
    keywords: [{ text: 'architecture', value: 9 }],
    sentiment: { positive: 83, neutral: 12, negative: 5 },
  },
];

describe('MuseumTable', () => {
  it('filters rows by name/address search query', () => {
    const onSelect = vi.fn();
    render(<MuseumTable data={museums} onSelect={onSelect} selectedId={null} />);

    fireEvent.change(screen.getByLabelText(/search museum/i), { target: { value: 'kolumba' } });

    expect(screen.getByText('Kolumba')).toBeInTheDocument();
    expect(screen.queryByText('Museum Ludwig')).not.toBeInTheDocument();
  });

  it('toggles rating sort direction when header is clicked', () => {
    const onSelect = vi.fn();
    render(<MuseumTable data={museums} onSelect={onSelect} selectedId={null} />);

    const rowsDesc = screen.getAllByRole('row');
    expect(within(rowsDesc[1]).getByText('Kolumba')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Rating'));
    const rowsAsc = screen.getAllByRole('row');
    expect(within(rowsAsc[1]).getByText('Wallraf-Richartz-Museum')).toBeInTheDocument();
  });

  it('calls onSelect when a row is clicked', () => {
    const onSelect = vi.fn();
    render(<MuseumTable data={museums} onSelect={onSelect} selectedId={null} />);

    fireEvent.click(screen.getByText('Museum Ludwig'));
    expect(onSelect).toHaveBeenCalledWith('Museum Ludwig');
  });
});
