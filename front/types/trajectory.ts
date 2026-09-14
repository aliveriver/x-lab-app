export type Trajectory = {
  id: string;
  name: string;
  created_at: string;
  sample_interval: number;
  max_duration: number;
  duration: number;
  frame_count: number;
};

export type TrajectoryStatus = {
  mode: 'idle' | 'recording' | 'replaying';
  active_name: string | null;
  active_id: string | null;
  elapsed: number;
  progress: number;
  last_error: string | null;
};
