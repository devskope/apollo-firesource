// @ts-ignore
import firestoreDocumentParser from 'firestore-parser';
import { UserInputError } from 'apollo-server-errors';

import FireSource from 'firesource';
import {
  IDocument,
  DocumentOptions,
  BatchGetDocumentOptions,
  CreateDocumentOptions,
  DeleteDocumentOptions,
  ListCollectionIdOptions,
  ListDocumentOptions,
  QueryDocumentOptions,
  UpdateDocumentOptions,
  TransactionCommitOptions,
  BatchGetResult,
  BatchGetResponseItem,
  QueryResponseItem,
  QueryResult,
  TransactionOptions,
} from '../../types/documents';
import {
  buildQueryString,
  buildRecursiveQueryString,
  isvalidSubPath,
} from '../../utils';

let documents: IDocument;

documents = function (this: FireSource) {
  return {
    batchGet: async (options: BatchGetDocumentOptions) => {
      const { documents, fieldsToReturn, consistencySelector } = options;
      const path = `${this.database}/documents:batchGet`;
      const payload = {
        documents: documents.map((doc) => {
          return `${this.documentBasePath}/${doc.collectionId}/${doc.docId}`;
        }),
        ...(fieldsToReturn && { mask: { fieldPaths: fieldsToReturn } }),
        ...consistencySelector,
      };

      const response = await this.post(path, payload);

      const batchGetResult: BatchGetResult = response.reduce(
        (result: BatchGetResult, item: BatchGetResponseItem) => {
          if (item?.found) {
            item.found.readTime = item.readTime;
            delete item.readTime;
            result.documents.push(firestoreDocumentParser(item.found));
            result.documentCount = result.documents.length;
          }

          if (!result.readTime && item.readTime) {
            result.readTime = item.readTime;
          }

          if (item.missing) {
            result.missing.push(item.missing);
          }

          if (item.transaction) {
            result.transaction = item.transaction;
          }
          return result;
        },
        {
          documents: [],
          documentCount: 0,
          missing: [],
          readTime: '',
          transaction: '',
        }
      );

      return batchGetResult;
    },

    beginTransaction: async (options: TransactionOptions) => {
      const { readOnly, readWrite } = options;
      const path = `${this.database}/documents:beginTransaction`;

      if (readOnly && readWrite) {
        throw new UserInputError(
          `transaction options can only be one of: readOnly | readWrite`
        );
      }

      return this.post(path, { options });
    },

    commit: async (options: TransactionCommitOptions) => {
      const { transaction } = options;
      const path = `${this.database}/documents:commit`;

      if (typeof transaction !== 'string') {
        throw new UserInputError('transaction string must be proided');
      }

      if (!options.writes || !(options.writes instanceof Array)) {
        throw new UserInputError(
          'At least one write operation must be provided in the writes array'
        );
      }

      const writes = options.writes.map((write) => {
        const { operation, currentDocument, updateOptions } = write;
        const updateMask: { fieldPaths?: string[] } = {};

        if (!operation || (operation && Object.keys(operation).length !== 1)) {
          throw new UserInputError('only one operation mode must be specified');
        }

        if (operation.transform) {
          const { documentPath, fieldTransforms } = operation.transform;

          if (!isvalidSubPath(documentPath)) {
            throw new UserInputError(
              `documentPath must start with and not end with '/'`
            );
          }

          operation.transform.document = this.documentBasePath + documentPath;
          delete operation.transform.documentPath;
          operation.transform.fieldTransforms = fieldTransforms.map((t) => {
            const transform = { ...t, ...t.transformType };
            delete transform.transformType;
            return transform;
          });
        }

        if (operation.update) {
          const { documentPath } = operation.update;

          if (!isvalidSubPath(documentPath)) {
            throw new UserInputError(
              `documentPath must start with and not end with '/'`
            );
          }

          operation.update.name = this.documentBasePath + documentPath;
          delete operation.update.documentPath;
        }

        if (updateOptions) {
          const { fieldsToUpdate, updateAll } = updateOptions;

          if (!operation.update) {
            throw new UserInputError(
              'updateOptions can only be provided with an update operation'
            );
          }

          if (fieldsToUpdate && updateAll) {
            throw new UserInputError(
              'updateOptions must have only one property'
            );
          }

          if (fieldsToUpdate) {
            if (!(fieldsToUpdate instanceof Array) || !fieldsToUpdate.length) {
              throw new UserInputError(
                'fieldsToUpdate must be a non empty array of field names'
              );
            }

            updateMask.fieldPaths = fieldsToUpdate;
          }

          if (updateAll) {
            updateMask.fieldPaths = Object.keys(operation.update.fields);
          }
        }

        if (
          currentDocument &&
          (typeof currentDocument !== 'object' ||
            (currentDocument.exists && currentDocument.updateTime) ||
            !(currentDocument.exists || currentDocument.updateTime))
        ) {
          throw new UserInputError(
            'only "exists" or "updateTime" must be specified on currentDocument'
          );
        }

        return {
          ...(currentDocument && { currentDocument }),
          ...(updateMask.fieldPaths && { updateMask }),
          ...(operation.delete && { delete: operation.delete }),
          ...(operation.transform && { transform: operation.transform }),
          ...(operation.update && { update: operation.update }),
        };
      });

      return this.post(path, { transaction, writes });
    },

    create: async (options: CreateDocumentOptions) => {
      const { collectionId, docId, data, fieldsToReturn } = options;
      let path = `${this.database}/documents/${collectionId}`;

      if (docId) path += `?documentId=${docId}`;

      if (fieldsToReturn) {
        path = buildRecursiveQueryString(
          path,
          'mask.fieldPaths',
          fieldsToReturn
        );
      }

      const doc = await this.post(path, data);

      return firestoreDocumentParser(doc);
    },

    delete: async (options: DeleteDocumentOptions) => {
      const { collectionId, docId, currentDocument } = options;
      let path = `${this.database}/documents/${collectionId}/${docId}`;

      if (currentDocument) {
        const { exists, updateTime } = currentDocument;

        if (exists || !updateTime) {
          path += `?currentDocument.exists=${exists ? 'true' : 'false'}`;
        } else if (updateTime) {
          path += `?currentDocument.updateTime=${updateTime}`;
        }
      }

      const response = await this.delete(path);
      response.deleted = true;

      return response;
    },

    get: async (options: DocumentOptions) => {
      const { collectionId, docId, fieldsToReturn } = options;
      const collectionPath = `${this.database}/documents/${collectionId}`;
      let path;

      if (!docId) {
        path = collectionPath;

        if (fieldsToReturn) {
          path = buildRecursiveQueryString(
            path,
            'mask.fieldPaths',
            fieldsToReturn
          );
        }

        const docs = await this.get(path);

        return docs.documents
          ? docs.documents.map(firestoreDocumentParser)
          : [];
      } else {
        path = `${collectionPath}/${docId}`;

        if (fieldsToReturn) {
          path = buildRecursiveQueryString(
            path,
            'mask.fieldPaths',
            fieldsToReturn
          );
        }

        const doc = await this.get(path);

        return firestoreDocumentParser(doc);
      }
    },

    list: async (options: ListDocumentOptions) => {
      const { collectionPath, fieldsToReturn } = options;
      const {
        orderBy,
        pageSize,
        pageToken,
        showMissing,
        consistencySelector,
      } = options.queryOptions;
      let path = `${this.database}/documents`;

      if (!isvalidSubPath(collectionPath)) {
        throw new UserInputError(
          `collectionPath must start with and not end with '/'`
        );
      }

      if (orderBy && showMissing) {
        throw new UserInputError(
          `only one of 'orderBy' or 'showMissing' can be present on queryOptions`
        );
      }

      if (consistencySelector?.transaction && consistencySelector?.readTime) {
        throw new UserInputError(
          `only one of 'readTime' or 'transaction' can be present on queryOptions`
        );
      }

      path += collectionPath;

      if (pageToken) path = buildQueryString(path, 'pageToken', pageToken);
      if (pageSize) path = buildQueryString(path, 'pageSize', String(pageSize));
      if (orderBy) path = buildQueryString(path, 'orderBy', String(orderBy));
      if (showMissing) {
        path = buildQueryString(path, 'showMissing', String(showMissing));
      }

      if (consistencySelector?.transaction) {
        path = buildQueryString(
          path,
          'transaction',
          consistencySelector?.transaction
        );
      }

      if (consistencySelector?.readTime) {
        path = buildQueryString(
          path,
          'readTime',
          consistencySelector?.readTime
        );
      }

      if (fieldsToReturn) {
        path = buildRecursiveQueryString(
          path,
          'mask.fieldPaths',
          fieldsToReturn
        );
      }

      const response = await this.get(path);

      if (response.documents) {
        response.documents = response.documents.map(firestoreDocumentParser);
        response.documentCount = response.documents.length;
      } else response.documentCount = 0;

      return response;
    },

    listCollectionIds: async (options: ListCollectionIdOptions) => {
      const { documentPath, pageSize, pageToken } = options;

      let path = `${this.database}/documents`;

      if (!isvalidSubPath(documentPath)) {
        throw new UserInputError(
          `documentPath must start with and not end with '/'`
        );
      }

      path += documentPath + ':listCollectionIds';

      const response = await this.post(path, { pageSize, pageToken });

      if (response.collectionIds) {
        response.idCount = response.collectionIds.length;
      } else response.idCount = 0;

      return response;
    },

    rollBack: async (transaction: string) => {
      const path = `${this.database}/documents:rollback`;

      const response = await this.post(path, { transaction });
      response.rolledBack = true;

      return response;
    },

    runQuery: async (options: QueryDocumentOptions) => {
      const {
        collectionId,
        docId,
        structuredQuery,
        consistencySelector,
      } = options;
      let path = `${this.database}/documents`;

      if (collectionId && docId) path += `/${collectionId}/${docId}`;

      const response = await this.post(`${path}:runQuery`, {
        structuredQuery,
        ...consistencySelector,
      });

      const queryResult: QueryResult = response.reduce(
        (result: QueryResult, item: QueryResponseItem) => {
          if (item?.document) {
            item.document.readTime = item.readTime;
            delete item.readTime;
            result.documents.push(firestoreDocumentParser(item.document));
            result.documentCount = result.documents.length;
          }

          if (!result.readTime && item.readTime) {
            result.readTime = item.readTime;
          }

          if (item.skippedResults) {
            result.skippedResults = item.skippedResults;
          }

          if (item.transaction) {
            result.transaction = item.transaction;
          }
          return result;
        },
        {
          documents: [],
          documentCount: 0,
          readTime: '',
          skippedResults: 0,
          transaction: '',
        }
      );

      return queryResult;
    },

    update: async (options: UpdateDocumentOptions) => {
      const {
        collectionId,
        docId,
        data,
        fieldsToReturn,
        updateOptions,
      } = options;
      let path = `${this.database}/documents/${collectionId}/${docId}`;

      if (updateOptions.currentDocument) {
        const { exists, updateTime } = updateOptions.currentDocument;

        if (exists || !updateTime) {
          path += `?currentDocument.exists=${exists ? 'true' : 'false'}`;
        } else if (updateTime) {
          path += `?currentDocument.updateTime=${updateTime}`;
        }
      }

      if (updateOptions.updateAll) {
        path = buildRecursiveQueryString(
          path,
          'updateMask.fieldPaths',
          Object.keys(data.fields)
        );
      }

      if (updateOptions.fieldsToUpdate && !updateOptions.updateAll) {
        path = buildRecursiveQueryString(
          path,
          'updateMask.fieldPaths',
          updateOptions.fieldsToUpdate
        );
      }

      if (fieldsToReturn) {
        path = buildRecursiveQueryString(
          path,
          'mask.fieldPaths',
          fieldsToReturn
        );
      }

      const doc = await this.patch(path, data);
      return firestoreDocumentParser(doc);
    },
  };
};

export default documents;
