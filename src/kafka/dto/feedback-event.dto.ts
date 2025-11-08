export interface SkillRateEventDto {
  rating: number;
  review: string;
  reviewerUid: string;
  reviewedUid: string;
  skills: string[];
}

export interface CloudEventFeedbackDto {
  specversion?: string;
  id: string;
  source: string;
  subject: string;
  type: string;
  datacontenttype: string;
  time: string;
  data: SkillRateEventDto;
}


