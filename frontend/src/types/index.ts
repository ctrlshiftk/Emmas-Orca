export type OrcaProfile = {
  id: number;
  display_name: string;
  pod?: string | null;
  description?: string | null;
};

export type JourneyPoint = {
  observed_at: string;
  lat: number;
  lng: number;
  region?: string | null;
  confidence: number;
  notes?: string | null;
};

export type JourneyResponse = {
  orca: OrcaProfile;
  friend_nickname?: string | null;
  points: JourneyPoint[];
};
