import { RESTDataSource } from 'apollo-datasource-rest';

import { FireSourceConfig } from './types';

class FireSource extends RESTDataSource {
  private database: string;

  constructor({
    version = 'v1',
    resource = 'databases',
    database = '(default)',
    projectId,
  }: FireSourceConfig) {
    super();
    this.database = database;
    this.baseURL = `https://firestore.googleapis.com/${version}/projects/${projectId}/${resource}/`;
  }
}

export default FireSource;
