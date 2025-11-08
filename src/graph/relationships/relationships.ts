export enum RelationshipType {
  OWNS = 'OWNS',
  DESIRES = 'DESIRES',
  RATES = 'RATES',
  SWAPPED_WITH = 'SWAPPED_WITH',
}

export interface RatingProperties {
  rating: number;
  review?: string;
}

export interface SwapProperties {
  timestamp: string;
  success: boolean;
}


