
export interface Destination {
  name: string;
  address: string;
  distance: string;
  duration: string;
  rating?: number;
  batteryUsage?: number;
  lat?: number;
  lng?: number;
  distanceValue?: number;
}

export interface NavigationStep {
  instruction: string;
  distance: string;
  icon: 'straight' | 'left' | 'right' | 'u-turn' | 'roundabout';
}

export interface SearchResult {
  title: string;
  subtitle: string;
  category: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
  heading?: number | null;
}

export type DisplayMode = 'standard' | 'fsd';
