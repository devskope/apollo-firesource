export interface FireSourceConfig {
  version?: 'v1';
  projectId: string;
  resource?: 'databases' | 'locations';
  database?: string;
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type PickField<T, K extends keyof T> = Pick<T, K> &
  { [P in keyof Omit<T, K>]?: never };
