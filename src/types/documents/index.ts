import { DocumentData } from '@firebase/firestore-types';

export interface IDocument {
  (): {
    create(options: CreateDocumentOptions): DocumentData;
    delete(options: DeleteDocumentOptions): Promise<{ deleted?: boolean }>;
    get(options: DocumentOptions): DocumentData | DocumentData[];
    update(options: UpdateDocumentOptions): DocumentData;
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

export interface DeleteDocumentOptions extends DocumentOptions {
  docId: string;
  currentDocument?: currentDocument;
}

export interface UpdateDocumentOptions extends CreateDocumentOptions {
  docId: string;
  updateOptions:
    | {
        updateAll: true;
        fieldsToUpdate?: undefined;
        currentDocument?: currentDocument;
      }
    | {
        fieldsToUpdate: string[];
        updateAll?: undefined;
        currentDocument?: currentDocument;
      };
}

type currentDocument =
  | { exists: boolean; updateTime?: undefined }
  | { exists?: undefined; updateTime: string };
