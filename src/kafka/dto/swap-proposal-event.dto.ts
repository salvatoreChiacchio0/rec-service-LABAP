export interface SwapProposalEventDto {
  id: number;
  requestUserUid: string;
  offerUserUid: string;
  skillOfferedId: number;
  skillRequestedId: number;
  status: string;
}

export interface CloudEventSwapProposalDto {
  specversion?: string;
  id: string;
  source: string;
  subject: string;
  type: string;
  datacontenttype: string;
  time: string;
  data: SwapProposalEventDto;
}


