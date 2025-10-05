/**
 * Number Record data structure for Bitable operations
 * Used for storing participant meeting summaries
 */
export interface NumberRecordData {
  meet_participant: string[];
  participant_summary: string;
  meet_data: string[];
}

/**
 * Update Number Record data structure
 */
export interface UpdateNumberRecordData {
  meet_participant?: string[];
  participant_summary?: string;
  meet_data?: string[];
}
