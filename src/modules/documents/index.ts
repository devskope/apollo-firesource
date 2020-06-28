// @ts-ignore
import firestoreDocumentParser from 'firestore-parser';

import {
  IDocument,
  DocumentOptions,
  CreateDocumentOptions,
  DeleteDocumentOptions,
  QueryDocumentOptions,
  UpdateDocumentOptions,
  QueryResponseItem,
  QueryResult,
} from '../../types/documents';
import { buildRecursiveQueryString } from '../../utils';

let documents: IDocument;

documents = function () {
  return {
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

      return this.delete(path);
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
          }

          if (item.readTime && !result.readTime) {
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
        { documents: [], readTime: '', skippedResults: 0, transaction: '' }
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
