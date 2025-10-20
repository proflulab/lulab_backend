// 会议事件解析工具：统一从不同事件结构中提取会议元数据
// 保持与 LarkEventWsService 内部使用的字段一致，方便直接解构与缓存

export type MeetingMeta = {
  topic?: string;
  meetingNo?: string;
  startTime?: number | string;
  endTime?: number | string;
};

/**
 * 从原始事件数据中解析会议元数据（topic、meeting_no、start_time、end_time）
 * 兼容以下结构：
 * - data.meeting.xxx
 * - data.event.meeting.xxx
 * - data.event.xxx
 */
export function parseMeetingMetaFromEvent(plainData: unknown): MeetingMeta {
  const asRecord = (v: unknown): Record<string, unknown> =>
    typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
  const getString = (v: unknown): string | undefined => {
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    return undefined;
  };
  const getNumOrStr = (v: unknown): number | string | undefined => {
    if (typeof v === 'number' || typeof v === 'string') return v;
    return undefined;
  };

  const root = asRecord(plainData);
  const meeting = asRecord(root.meeting);
  const eventObj = asRecord(root.event);
  const eventMeeting = asRecord(eventObj.meeting);

  const topic =
    getString(meeting.topic) ??
    getString(eventMeeting.topic) ??
    getString(eventObj.topic);

  const meetingNo =
    getString(meeting.meeting_no) ??
    getString(eventObj.meeting_no) ??
    getString(eventMeeting.meeting_no);

  const startTime =
    getNumOrStr(meeting.start_time) ??
    getNumOrStr(eventMeeting.start_time) ??
    getNumOrStr(eventObj.start_time);

  const endTime =
    getNumOrStr(meeting.end_time) ??
    getNumOrStr(eventMeeting.end_time) ??
    getNumOrStr(eventObj.end_time);

  return { topic, meetingNo, startTime, endTime };
}
