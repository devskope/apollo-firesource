import { RESTDataSource, RequestOptions } from 'apollo-datasource-rest';

import { FireSourceConfig } from './types';
import { gtoken } from './utils';

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

  async willSendRequest(request: RequestOptions) {
    const token = await gtoken.getToken();
    request.headers.set('Authorization', `Bearer ${token.access_token}`);
  }
}

export default FireSource;
