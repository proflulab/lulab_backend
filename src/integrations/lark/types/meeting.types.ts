/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-28 06:15:49
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-09 01:15:32
 * @FilePath: /lulab_backend/src/integrations/lark/types/meeting.types.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

export interface MeetingData {
  platform: string;
  subject?: string;
  meeting_id: string;
  sub_meeting_id?: string;
  meeting_code?: string;
  start_time?: number;
  end_time?: number;
  operator?: string[];
  creator?: string[];
  participants?: string[];
  meeting_type?: string[];
}
