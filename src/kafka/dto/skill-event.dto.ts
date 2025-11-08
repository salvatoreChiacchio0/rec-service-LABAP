export interface SkillEventDto {
  id: number;
  label: string;
  description?: string;
}

export interface CloudEventSkillDto {
  specversion?: string;
  id: string;
  source: string;
  subject: string;
  type: string;
  datacontenttype: string;
  time: string;
  data: SkillEventDto;
}


