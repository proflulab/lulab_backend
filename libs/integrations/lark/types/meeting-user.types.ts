export interface MeetingUserData {
  uuid: string;
  userid?: string;
  user_name?: string;
  phone_hase?: string;
  is_enterprise_user?: boolean;
}

export interface UpdateMeetingUserData {
  userid?: string;
  user_name?: string;
  phone_hase?: string;
  is_enterprise_user?: boolean;
}
