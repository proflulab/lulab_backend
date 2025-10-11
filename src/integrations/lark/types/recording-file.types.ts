/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-10-01 01:08:34
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-06 03:38:50
 * @FilePath: /lulab_backend/src/integrations/lark/types/recording-file.types.ts
 * @Description:
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

export interface RecordingFileData {
  record_file_id: string;
  meet: string[];
  participants?: string[];
  start_time?: number;
  end_time?: number;
  meeting_summary?: string;
  ai_meeting_transcripts?: string;
  ai_minutes?: string;
  todo?: string;
  fullsummary?: string;
}
