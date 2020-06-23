export interface FireSourceConfig {
  version?: string;
  projectId: string;
  resource?: 'databases' | 'locations';
  database?: string;
}
