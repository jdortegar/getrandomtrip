import type { DocumentMetadata } from "@/lib/types/DocumentMetadata";

export interface SuggestedActivity {
  id: string;
  title: string;
  description: string;
  date?: string;
  time?: string;
}

export interface ExperienceRoadmapData {
  startDate: string;
  endDate: string;
  origin: string;
  destination: string;
  duration: string;
  heading: string;
  activities: SuggestedActivity[];
  mapUrl?: string;
}

export interface ExperienceRoadmapDocument extends DocumentMetadata {
  template: "experience-roadmap";
  templateVersion: 1;
  data: ExperienceRoadmapData;
}
