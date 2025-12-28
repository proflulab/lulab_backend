export interface MeetingUserData {
  uuid: string;
  userid?: string;
  user_name?: string;
  phone_hase?: string;
  is_enterprise_user?: boolean;
  meet?: string[];
  user?: string[];
  meet_creator?: string[];
}

export type UpdateMeetingUserData = Partial<Omit<MeetingUserData, 'uuid'>>;
