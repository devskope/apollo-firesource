import { DocumentData } from '@firebase/firestore-types';

export interface IDocument {
  (): {
    get(options: DocOptions): DocumentData | DocumentData[];
  };
}

export interface DocOptions {
  collectionId: string;
  docId?: string;
  fieldsToReturn?: string[];
}
export interface CreateDocOptions extends DocOptions {
  data: {
    name?: string;
    fields: {
      [key: string]: object;
    };
  };
}
export interface updateDocOptions extends CreateDocOptions {
  docId: string;
  updateOptions: {
    updateAll: boolean;
    fieldsToUpdate?: string[];
    currentDocument?: any;
  };
}
