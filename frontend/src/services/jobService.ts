import { apiClient } from '../api/client';

export type JobStatus = 'running' | 'done' | 'failed';

export interface JobState {
  jobId: string;
  total: number;
  done: number;
  failed: number;
  status: JobStatus;
}

// Viesti, jonka notifier lähettää WebSocketiin
export interface JobMessage {
  jobId: string;
  aoiId: string;
  status: 'done' | 'failed'; // yksittäisen pellon tulos
  jobStatus: JobStatus;      // koko työn tila
  done: number;
  failed: number;
  total: number;
}

export const getJob = async (jobId: string): Promise<JobState> => {
  const res = await apiClient.get<JobState>(`/api/jobs/${jobId}`);
  return res.data;
};