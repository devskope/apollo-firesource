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
    create(options: CreateDocumentOptions): Promise<Document>;
    delete(options: DeleteDocumentOptions): Promise<{ deleted: true }>;
    get(options: GetDocumentOptions): Promise<Document | Documents>;
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
    update(options: UpdateDocumentOptions): Promise<Document>;
  };
}

export interface BatchGetDocumentOptions {
  documents: string[];
  fieldsToReturn?: string[];
  consistencySelector?: consistencySelector;
}

export interface CreateDocumentOptions extends CreateUpdateOptions {
  collectionPath: string;
  docId?: string;
}

export interface DeleteDocumentOptions {
  documentPath: string;
  currentDocument?: currentDocument;
}

export interface ListCollectionIdOptions {
  documentPath: string;
  pageSize?: number;
  pageToken?: string;
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
  documentPath?: string;
  consistencySelector?: consistencySelector;
}

export interface UpdateDocumentOptions extends CreateUpdateOptions {
  documentPath: string;
  updateOptions?:
    | (PickField<UpdateOptions, 'fieldsToUpdate'> & {
        currentDocument?: currentDocument;
      })
    | (PickField<UpdateOptions, 'updateAll'> & {
        currentDocument?: currentDocument;
      });
}

export interface TransactionCommitOptions {
  transaction: string;
  writes: {
    currentDocument?: currentDocument;
    operation:
      | PickField<TransformOperations, 'delete'>
      | PickField<TransformOperations, 'update'>
      | PickField<TransformOperations, 'transform'>;
    updateOptions?:
      | PickField<UpdateOptions, 'fieldsToUpdate'>
      | PickField<UpdateOptions, 'updateAll'>;
  }[];
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

export type GetDocumentOptions =
  | GetDocumentsByPath
  | GetDocumentsFromCollection;

export type TransactionOptions =
  | PickField<TransactionMode, 'readOnly'>
  | PickField<TransactionMode, 'readWrite'>;

interface Consistency {
  transaction: string;
  newTransaction: TransactionOptions;
  readTime: string;
}

interface CreateUpdateOptions {
  fieldsToReturn?: [];
  data: {
    documentPath?: string;
    fields: {
      [key: string]: object;
    };
  };
}

interface Documents {
  documents: Document[];
  documentCount: number;
}
interface Document {
  name: string;
  fields: object;
  createTime: string;
  updateTime: string;
}

interface FieldTransformTypes {
  setToServerValue: string;
  increment: object;
  maximum: object;
  minimum: object;
  appendMissingElements: object;
  removeAllFromArray: object;
}

interface GetDocumentsFromCollection {
  collectionPath: string;
  documentPath?: never;
  fieldsToReturn?: [];
}

interface GetDocumentsByPath {
  documentPath: string;
  collectionPath?: never;
  fieldsToReturn?: [];
}

interface ListQueryBaseOptions {
  pageSize?: number;
  pageToken?: string;
  consistencySelector?: consistencySelector;
}

interface ListWithMissing extends ListQueryBaseOptions {
  showMissing?: boolean;
  orderBy?: never;
}

interface ListWithWhere extends ListQueryBaseOptions {
  orderBy?: string;
  showMissing?: never;
}

interface TransactionMode {
  readOnly: { readTime?: string };
  readWrite: { retryTransaction?: string };
}

interface TransformOperations {
  delete: string;
  update: {
    documentPath: string;
    fields: {
      [key: string]: object;
    };
    [key: string]: any;
  };
  transform: {
    documentPath: string;
    fieldTransforms: { fieldPath: string; transformType: transformType }[];
    [key: string]: any;
  };
}

interface UpdateOptions {
  updateAll: true;
  fieldsToUpdate: string[];
}

type consistencySelector =
  | PickField<Consistency, 'transaction'>
  | PickField<Consistency, 'newTransaction'>
  | PickField<Consistency, 'readTime'>;

type currentDocument =
  | { exists: boolean; updateTime?: never }
  | { exists?: never; updateTime: string };

type transformType =
  | PickField<FieldTransformTypes, 'setToServerValue'>
  | PickField<FieldTransformTypes, 'increment'>
  | PickField<FieldTransformTypes, 'maximum'>
  | PickField<FieldTransformTypes, 'minimum'>
  | PickField<FieldTransformTypes, 'appendMissingElements'>
  | PickField<FieldTransformTypes, 'removeAllFromArray'>;
