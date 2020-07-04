import { DocumentData } from '@firebase/firestore-types';
import { PickField } from './../firesource';

export interface IDocument {
  (): {
    batchGet(options: BatchGetDocumentOptions): Promise<BatchGetResult>;
    beginTransaction(
      options: TransactionOptions
    ): Promise<{ transaction: string }>;
    commit(
      options: TransactionCommitOptions
    ): Promise<{
      writeResults: { updateTime?: string; transformResults?: object[] }[];
      commitTime: string;
    }>;
    create(options: CreateDocumentOptions): Promise<DocumentData>;
    delete(options: DeleteDocumentOptions): Promise<{ deleted: true }>;
    get(options: DocumentOptions): Promise<DocumentData | DocumentData[]>;
    list(options: ListDocumentOptions): Promise<ListResult>;
    listCollectionIds(
      options: ListCollectionIdOptions
    ): Promise<{
      collectionIds?: string[];
      idCount: number;
      nextPageToken?: 'string';
    }>;
    rollBack(transaction: string): Promise<{ rolledBack: true }>;
    runQuery(options: QueryDocumentOptions): Promise<QueryResult>;
    update(options: UpdateDocumentOptions): Promise<DocumentData>;
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

export interface ListResult {
  documents?: [];
  documentCount: number;
  nextPageToken: string;
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

export interface ListCollectionIdOptions {
  documentPath: string;
  pageSize?: number;
  pageToken?: string;
}

export interface ListQueryBaseOptions {
  pageSize?: number;
  pageToken?: string;
  consistencySelector?: Transaction | ReadTime;
}

export interface ListWithWhere extends ListQueryBaseOptions {
  orderBy?: string;
  showMissing?: never;
}
export interface ListWithMissing extends ListQueryBaseOptions {
  showMissing?: boolean;
  orderBy?: never;
}

export interface ListDocumentOptions {
  collectionPath: string;
  fieldsToReturn?: string[];
  queryOptions?: ListWithWhere | ListWithMissing;
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
        fieldsToUpdate?: never;
        currentDocument?: currentDocument;
      }
    | {
        fieldsToUpdate: string[];
        updateAll?: never;
        currentDocument?: currentDocument;
      };
}

interface DeleteOperation {
  delete: string;
  update?: never;
  transform?: never;
}

interface UpdateOperation {
  update: {
    documentPath: string;
    fields: {
      [key: string]: object;
    };
    [key: string]: any;
  };
  delete?: never;
  transform?: never;
}

interface FieldTransformTypes {
  setToServerValue: string;
  increment: object;
  maximum: object;
  minimum: object;
  appendMissingElements: object;
  removeAllFromArray: object;
}

interface TransformOperation {
  transform: {
    documentPath: string;
    fieldTransforms: { fieldPath: string; transformType: transformType }[];
    [key: string]: any;
  };
  update?: never;
  delete?: never;
}

export interface TransactionCommitOptions {
  transaction: string;
  writes: {
    operation: DeleteOperation | UpdateOperation | TransformOperation;
    currentDocument?: currentDocument;
    updateOptions?:
      | {
          updateAll: true;
          fieldsToUpdate?: never;
        }
      | {
          fieldsToUpdate: string[];
          updateAll?: never;
        };
  }[];
}

interface Transaction {
  transaction: string;
  newTransaction?: never;
  readTime?: never;
}

interface NewTransaction {
  newTransaction: TransactionOptions;
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
  | { exists: boolean; updateTime?: never }
  | { exists?: never; updateTime: string };

export type TransactionOptions =
  | {
      readOnly: { readTime?: string };
      readWrite?: never;
    }
  | {
      readWrite: { retryTransaction?: string };
      readOnly?: never;
    };

type transformType =
  | PickField<FieldTransformTypes, 'setToServerValue'>
  | PickField<FieldTransformTypes, 'increment'>
  | PickField<FieldTransformTypes, 'maximum'>
  | PickField<FieldTransformTypes, 'minimum'>
  | PickField<FieldTransformTypes, 'appendMissingElements'>
  | PickField<FieldTransformTypes, 'removeAllFromArray'>;
