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
export function parseMeetingMetaFromEvent(plainData: any): MeetingMeta {
  const topic =
    plainData?.meeting?.topic ??
    plainData?.event?.meeting?.topic ??
    plainData?.event?.topic;

  const meetingNo =
    plainData?.meeting?.meeting_no ??
    plainData?.event?.meeting_no ??
    plainData?.event?.meeting?.meeting_no;

  const startTime =
    plainData?.meeting?.start_time ??
    plainData?.event?.meeting?.start_time ??
    plainData?.event?.start_time;

  const endTime =
    plainData?.meeting?.end_time ??
    plainData?.event?.meeting?.end_time ??
    plainData?.event?.end_time;

  return { topic, meetingNo, startTime, endTime };
}