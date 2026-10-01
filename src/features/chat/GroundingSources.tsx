export interface GroundingSource {
  title: string;
  url: string;
  domain?: string;
}

export interface GroundingSourcesProps {
  sources?: GroundingSource[];
  queries?: string[];
  language?: 'ar' | 'en';
}

export function GroundingSources(_props: GroundingSourcesProps) {
  // Removed completely per user request
  return null;
}
