export interface MuseumData {
  name: string;
  rating: number;
  reviewCount: number;
  address?: string;
  url?: string; // Google Maps URL
  keywords: { text: string; value: number }[]; // For word cloud
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface MuseumHistory {
  name: string;
  date: string;
  rating: number;
  reviewCount: number;
}