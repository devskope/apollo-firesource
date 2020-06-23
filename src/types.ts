export interface FireSourceConfig {
  version?: 'v1';
  projectId: string;
  resource?: 'databases' | 'locations';
  database?: string;
}
