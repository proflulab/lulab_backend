/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-11-23 01:23:27
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-11-23 01:28:12
 * @FilePath: /lulab_backend/src/lark-meeting/types/lark-meeting.types.ts
 * @Description:
 *  *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

export interface MeetingEndedEventData {
  schema: string;
  header: {
    event_id: string;
    event_type: string;
    create_time: string;
    token: string;
    app_id: string;
    tenant_key: string;
  };
  event: {
    meeting: {
      id: string;
      topic: string;
      meeting_no: string;
      meeting_source: number;
      start_time: string;
      end_time: string;
      host_user: {
        id: {
          union_id: string;
          user_id: string;
          open_id: string;
        };
        user_role: number;
        user_type: number;
      };
      owner: {
        id: {
          union_id: string;
          user_id: string;
          open_id: string;
        };
        user_role: number;
        user_type: number;
      };
      calendar_event_id: string;
    };
    operator: {
      id: {
        union_id: string;
        user_id: string;
        open_id: string;
      };
      user_role: number;
      user_type: number;
    };
  };
}
