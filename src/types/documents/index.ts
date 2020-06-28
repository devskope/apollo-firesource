import { DocumentData } from '@firebase/firestore-types';

export interface IDocument {
  (): {
    create(options: CreateDocumentOptions): Promise<DocumentData>;
    batchGet(options: BatchGetDocumentOptions): Promise<BatchGetResult>;
    delete(options: DeleteDocumentOptions): Promise<{ deleted?: boolean }>;
    get(options: DocumentOptions): Promise<DocumentData | DocumentData[]>;
    update(options: UpdateDocumentOptions): Promise<DocumentData>;
    runQuery(options: QueryDocumentOptions): Promise<QueryResult>;
  };
}

export interface BatchGetResponseItem {
  found?: { [field: string]: any };
  missing?: string;
  readTime?: string;
  transaction?: string;
}

export interface BatchGetResult {
  documents: { readTime: string; [field: string]: any }[];
  documentCount: number;
  readTime: string;
  missing: string[];
  transaction: string;
}

export interface QueryResponseItem {
  document?: {
    [field: string]: any;
  };
  readTime?: string;
  skippedResults?: number;
  transaction?: string;
}

export interface QueryResult {
  documents: { readTime: string; [field: string]: any }[];
  documentCount: number;
  readTime: string;
  skippedResults: number;
  transaction: string;
}

export interface BatchGetDocumentOptions {
  documents: { collectionId: string; docId: string }[];
  fieldsToReturn?: string[];
  consistencySelector?: ConsistencySelector;
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

export interface QueryDocumentOptions {
  structuredQuery: {
    select?: { fields: object[] };
    from?: { collectionId: string; allDescendants?: boolean }[];
    where?: object;
    orderBy?: object;
    startAt?: object;
    endAt?: object;
    offset?: number;
    limit?: number;
  };
  collectionId?: string;
  docId?: string;
  consistencySelector?: ConsistencySelector;
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

interface Transaction {
  transaction: string;
  newTransaction: never;
  readTime: never;
}

interface NewTransaction {
  newTransaction:
    | {
        readOnly: { readTime: string };
        readWrite?: never;
      }
    | {
        readWrite: { retryTransaction: string };
        readOnly?: never;
      };
  readTime?: never;
  transaction?: never;
}

interface ReadTime {
  readTime: string;
  transaction?: never;
  newTransaction?: never;
}
type ConsistencySelector = Transaction | NewTransaction | ReadTime;

type currentDocument =
  | { exists: boolean; updateTime?: undefined }
  | { exists?: undefined; updateTime: string };
