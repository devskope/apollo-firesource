import { RESTDataSource, RequestOptions } from 'apollo-datasource-rest';

import documents from './modules/documents';
import { gtoken } from './utils';
import { FireSourceConfig } from './types/firesource';
import { IDocument } from './types/documents/index';

class FireSource extends RESTDataSource {
  database: string;
  documentBasePath: string;
  documents: IDocument;

  constructor({
    version = 'v1',
    resource = 'databases',
    database = '(default)',
    projectId,
  }: FireSourceConfig) {
    super();
    this.database = database;
    this.baseURL = `https://firestore.googleapis.com/${version}/projects/${projectId}/${resource}/`;
    this.documentBasePath =
      this.baseURL.substring(this.baseURL.indexOf('projects')) +
      this.database +
      '/documents';

    this.documents = documents.bind(this);
  }

  async willSendRequest(request: RequestOptions) {
    const token = await gtoken.getToken();
    request.headers.set('Authorization', `Bearer ${token.access_token}`);
  }
}

export default FireSource;
