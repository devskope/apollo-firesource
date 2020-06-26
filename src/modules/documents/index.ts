// @ts-ignore
import firestoreDocumentParser from 'firestore-parser';

import {
  IDocument,
  DocumentOptions,
  CreateDocumentOptions,
  UpdateDocumentOptions,
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
