// @ts-ignore
import firestoreDocumentParser from 'firestore-parser';

import FireSource from 'firesource';
import {
  IDocument,
  BatchGetDocumentOptions,
  CreateDocumentOptions,
  DeleteDocumentOptions,
  GetDocumentOptions,
  ListCollectionIdOptions,
  ListDocumentOptions,
  QueryDocumentOptions,
  UpdateDocumentOptions,
  TransactionOptions,
  TransactionCommitOptions,
  BatchGetResult,
  BatchGetResponseItem,
  QueryResponseItem,
  QueryResult,
} from '../../types/documents';
import {
  buildQueryString,
  buildRecursiveQueryString,
} from '../../utils/buildQueryString';
import { inputError, validateSubPath } from '../../utils/validators';

const documents: IDocument = function (this: FireSource) {
  return {
    batchGet: async (options: BatchGetDocumentOptions) => {
      const { documents, fieldsToReturn, consistencySelector } = options;
      const path = `${this.database}/documents:batchGet`;

      const payload = {
        documents: documents.map((documentPath, idx) => {
          validateSubPath({
            path: documentPath,
            collection: 'documents',
            name: 'documentPath',
            idx,
          });

          return this.documentBasePath + documentPath;
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
        const errorMessage = `transaction options can only be one of: readOnly | readWrite`;
        inputError(errorMessage);
      }

      return this.post(path, { options });
    },

    commit: async (options: TransactionCommitOptions) => {
      const { transaction } = options;
      const path = `${this.database}/documents:commit`;

      if (typeof transaction !== 'string') {
        inputError('transaction string must be proided');
      }

      if (!options.writes || !(options.writes instanceof Array)) {
        const errorMessage = `At least one write operation must be provided in the writes array`;
        inputError(errorMessage);
      }

      const writes = options.writes.map((write) => {
        const { operation, currentDocument, updateOptions } = write;
        const updateMask: { fieldPaths?: string[] } = {};

        if (!operation || (operation && Object.keys(operation).length !== 1)) {
          inputError('only one operation mode must be specified');
        }

        if (operation.transform) {
          const { documentPath, fieldTransforms } = operation.transform;
          validateSubPath({ path: documentPath, name: 'documentPath' });
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
          validateSubPath({ path: documentPath, name: 'documentPath' });
          operation.update.name = this.documentBasePath + documentPath;
          delete operation.update.documentPath;
        }

        if (updateOptions) {
          const { fieldsToUpdate, updateAll } = updateOptions;

          if (!operation.update) {
            const errorMessage = `updateOptions can only be provided with an update operation`;
            inputError(errorMessage);
          }

          if (fieldsToUpdate && updateAll) {
            inputError('updateOptions must have only one property');
          }

          if (fieldsToUpdate) {
            if (!(fieldsToUpdate instanceof Array) || !fieldsToUpdate.length) {
              const errorMessage = `fieldsToUpdate must be a non empty array of field names`;
              inputError(errorMessage);
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
          const errorMessage = `only "exists" or "updateTime" must be specified on currentDocument`;
          inputError(errorMessage);
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
      const { collectionPath, docId, data, fieldsToReturn } = options;
      validateSubPath({ path: collectionPath, name: 'collectionPath' });
      let path = `${this.database}/documents` + collectionPath;

      if (docId) path += '?documentId=' + docId;

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
      const { currentDocument, documentPath } = options;
      validateSubPath({ path: documentPath, name: 'documentPath' });
      let path = `${this.database}/documents` + documentPath;

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

    get: async (options: GetDocumentOptions) => {
      const { collectionPath, documentPath, fieldsToReturn } = options;

      if (collectionPath && documentPath) {
        const errorMessage = `only one of collectionPath or documentPath must be specified`;
        inputError(errorMessage);
      }

      if (collectionPath) {
        validateSubPath({ path: collectionPath, name: 'collectionPath' });
        let path = `${this.database}/documents` + collectionPath;

        if (fieldsToReturn) {
          path = buildRecursiveQueryString(
            path,
            'mask.fieldPaths',
            fieldsToReturn
          );
        }

        const docs = await this.get(path);
        return docs.documents
          ? {
              documents: docs.documents.map(firestoreDocumentParser),
              documentCount: docs.documents.length,
            }
          : { documentCount: 0 };
      } else {
        validateSubPath({ path: documentPath, name: 'documentPath' });
        let path = `${this.database}/documents` + documentPath;

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
      validateSubPath({ path: collectionPath, name: 'collectionPath' });
      path += collectionPath;

      if (orderBy && showMissing) {
        const errorMessage = `only one of 'orderBy' or 'showMissing' can be present on queryOptions`;
        inputError(errorMessage);
      }

      if (consistencySelector?.transaction && consistencySelector?.readTime) {
        const errorMessage = `only one of 'readTime' or 'transaction' can be present on queryOptions`;
        inputError(errorMessage);
      }

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
      validateSubPath({ path: documentPath, name: 'documentPath' });
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
      const { documentPath, structuredQuery, consistencySelector } = options;
      let path = `${this.database}/documents`;

      if (documentPath) {
        validateSubPath({ path: documentPath, name: 'documentPath' });
        path += documentPath;
      }

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
      const { documentPath, data, fieldsToReturn, updateOptions } = options;

      validateSubPath({ path: documentPath, name: 'documentPath' });
      let path = `${this.database}/documents` + documentPath;

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
