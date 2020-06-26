import { DocumentData } from '@firebase/firestore-types';

export interface IDocument {
  (): {
    create(options: CreateDocumentOptions): DocumentData;
    get(options: DocumentOptions): DocumentData | DocumentData[];
  };
}

export interface DocumentOptions {
  collectionId: string;
  docId?: string;
  fieldsToReturn?: string[];
}
export interface CreateDocumentOptions extends DocumentOptions {
  data: {
    name?: string;
    fields: {
      [key: string]: object;
    };
  };
}
export interface updateDocumentOptions extends CreateDocumentOptions {
  docId: string;
  updateOptions: {
    updateAll: boolean;
    fieldsToUpdate?: string[];
    currentDocument?: any;
  };
}
