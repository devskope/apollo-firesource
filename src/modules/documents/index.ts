// @ts-ignore
import firestoreDocumentParser from 'firestore-parser';

import { IDocument, DocOptions } from '../../types/documents';
import { buildRecursiveQueryString } from '../../utils';

let documents: IDocument;

documents = function () {
  return {
    get: async (options: DocOptions) => {
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
  };
};

export default documents;
