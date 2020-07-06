# Apollo-Firesource

Apollo server datasource wrapping Firestore REST APIs. &nbsp;&nbsp; [PRs welcome 😊]

## Basic Usage

- Set required environment variables:

  - `FIRESOURCE_CREDENTIALS=<Path-to-service-account-json>` // must have firestore access

- Pass `FireSource` instance as option to `ApolloServer` constructor:
  ```javascript
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => {
      return {
        firestore: new FireSource({
          projectId: <Firestore-project-id>
          // ... other options
        }),
      };
    },
  });
  ```
- Access the data source from resolvers:

  ```javascript
  Query: {
    document: async (parent, args, ctx) => {
      const { documentPath } = args;
      const { dataSources: { firestore } } = ctx;

      try {
        // get document by id from collection
        return firestore.documents().get({ documentPath });
      } catch (error) {
        /* handle error
         *
         * Ideally first handle Firestore error responses:
         *   error.extensions?.response - exception details
         *
         * Then FireSource Errors:
         *   error.extensions.code === <'BAD_USER_INPUT'|'UNAUTHENTICATED'>
         *   error.message - exception details
         */
      }
    },
  },
  ```

  ## API

  ### Constructor - `firestore = new FireStore(config)`:

  - **config** (_object_):
    ```javascript
    {
      projectId: string, // (required) Firestore project ID
      version: 'v1', // string (optional)
      resource: 'databases', // string: <'databases' | 'locations'> (optional)
      database: '(default)', // string (optional)
    }
    ```

  ### Documents - `firestore.documents()`

  - **presets**

    - `documentBasePath = projects/<Firestore-project-id>/databases/<database>/documents`
      Paths relative to `documentBasePath` (`collectionPath/documentPath`) must start with and not end with `'/'` &nbsp; ex: `'/users/bob'`

  - **methods** (_async_):

    - `batchGet(options) => batchGetResult`

      Get multiple documents from database.

      - **options** (_object_)

        ```javascript
        {
          documents: string[], // (required) Array of document paths relative to documentBasePath ('.../databases/<db>/documents')  ex '/users/mike1'
          fieldsToReturn: string[], // (optional) array of document fields to include in response

          // (optional)
          consistencySelector: {
            // Union field consistencySelector can be only one of the following:
            transaction: string,  // Reads documents in a transaction: A base64-encoded string.
            newTransaction: TransactionOptions, // https://cloud.google.com/firestore/docs/reference/rest/v1/TransactionOptions
            readTime: string
          }
        }
        ```

      - **returns** (object): BatchGetResult
        ```javascript
        {
          documents: Array,
          documentCount:number,
          missing: Array,
          readTime: string,
          transaction: string
        }
        ```

      <br />

    - `beginTransaction(options) => object`

      Start a new transaction.

      - **options** (_object_): optional

        ```javascript
        // https://cloud.google.com/firestore/docs/reference/rest/v1/TransactionOptions
        {
          readOnly: {
            readTime: string // (optional): Timestamp format
          },
          readWrite: {
            retryTransaction: string // (optional)
          }

        }
        ```

      - **returns** (object):
        ```javascript
        {
          transaction: string;
        }
        ```

      <br />

    - `create(options) => Document`

      Insert new document into a collection.

      - **options** (_object_)

        ```javascript
        {
          collectionPath: string, // (required) path to parent collection relative to documentBasePath
          docId: string   // (optional) custom document id
          fieldsToReturn: string[] // (optional) array of fields to include in response (mask)
          data: {
            name: string  // (optional) document resource name
            fields: {
              "fieldName": {
                // where 'valueType' is one of https://cloud.google.com/firestore/docs/reference/rest/v1/Value
                valueType: value
              }
            }
          }
        }
        ```

      - **returns** (_object_): Document

        ```javascript
        {
          name: string
          fields: object,
          createTime: string,
          updateTime: string,
        }
        ```

      <br />

    - `commit(options) => CommitResponse`

      Commits a transaction while optionally updating documents.

      - **options** (_object_)

        ```javascript
        {
          transaction: string, // (required) A base64-encoded transaction id string.

          // writes is an array of objects
          writes: [
            {
              // (required)  The operation to execute
              operation: {
                // Union field operation can be only one of the following:
                delete: string,   // Path to document to delete relative to documentBasePath,  ex. '/users/joe'
                transform: {
                  documentPath: string,  // (required) Path to document relative to documentBasePath
                  fieldTransforms: Array<fieldTransform> // (required) Array of field transforms to apply;
                }
                update: {
                  documentPath: string,  // (required) Path to document to update relative to documentBasePath
                  fields: {
                    fieldName: {
                      // where 'valueType' is one of https://cloud.google.com/firestore/docs/reference/rest/v1/Value
                      valueType: value
                    }
                  },
                };
              }

              // (optional)
              currentDocument: {
                // Union field currentDocument can be only one of the following:
                exists: boolean,   // (optional) When set to true, the target document must exist. When set to false, the target document must not exist
                updateTime: string // (optional) Timestamp format When set, the target document must exist and have been last updated at that time
              }

              // (optional) Can be set only when the operation is update. if not set, existing document is overitten
              updateOptions: {
                // Union field updateOptions can be only one of the following:
                updateAll: boolean,  // (optional) update all fields
                fieldsToUpdate: string[], // array of fields to update
              }
            }
          ]
        }
        ```

      - **fieldTransform** (_object_)

        ```javascript
        {
          fieldPath: string; // (required) Path of field to transform
          transformType: {
            // Union field transformType can be only one of the following:
            setToServerValue: 'SERVER_VALUE_UNSPECIFIED' | 'REQUEST_TIME'; // Sets the field to the given server value.
            increment: object; // Adds the given value to the field's current value.
            maximum: object; // Sets the field to the maximum of its current value and the given value.
            minimum: object; // Sets the field to the minimum of its current value and the given value.
            appendMissingElements: object; // Append the given elements in order if they are not already present in the current field value
            removeAllFromArray: object; //  Remove all of the given elements from the array in the field.
          }
        }
        ```

      - **returns** (_object_): CommitResponse

        ```javascript
        {
          writeResults: Array; // https://cloud.google.com/firestore/docs/reference/rest/v1/WriteResult
          commitTime: string;
        }
        ```

      <br />

    - `delete(options) => object`

      Delete document from collection.

      - **options** (_object_)

        ```javascript
        {
          documentPath: string, // (required) path to document relative to documentBasePath

          // (optional)
          currentDocument: {
            exists: boolean,  // (optional) When set to true, the target document must exist. When set to false, the target document must not exist
            updateTime: string // (optional) Timestamp format: When set, the target document must exist and have been last updated at that time
          }
        }
        ```

      - **returns** (_object_):
        ```javascript
        {
          deleted: boolean;
        }
        ```

      <br />

    - `get(options) => DocumentData | DocumentData[]`

      Retrieve one or all documents from a collection.

      - **options** (_object_)
        ```javascript
        {
          collectionPath: string,  // (optional) relative path to collection: if set and !documentPath ,get all documents in collection
          documentPath: string,    // (optional) relative path to document: if set and !collectionPath, get single document
          fieldsToReturn: string[]   // (optional) Array of fields to include in response (mask)
        }
        ```
      - **returns** (_object_): Document | Documents

        ```javascript
        // Document
        {
          name: string
          fields: object,
          createTime: string,
          updateTime: string,
        }

        // Documents
        {
          documents: Document[];
          documentCount: number;
        }
        ```

      <br />

    - `list(options) => ListResult`

      Get a list of documents

      - **options** (_object_)

        ```javascript
        {
          collectionPath: string;    // (required) Full collection path relative to documentPath ex: '/users'
          fieldsToReturn: string[];  // (optional) array of fields to include in response (mask)

          // (optional)
          queryOptions: {
            pageSize: number,      // (optional) Maximum number of documents to return
            pageToken: string,     // (optional) The nextPageToken value returned from a previous List request, if any.
            showMissing: boolean,  // (optional)  Show missing documents. Requests with showMissing may not specify orderBy.
            orderBy: string,       // (optional) The order to sort results by. For example: priority desc, name.

            // (optional)
            consistencySelector: {
              // can be only one of the following:
              transaction: string,   // (optional) Reads documents in a transaction: A base64-encoded string
              readTime: string     // (optional) string (Timestamp format): Reads documents as they were at the given time
            }
          }
        }
        ```

      - **returns** (object): ListResult
        ```javascript
        {
          documents: Array,
          documentCount:number,
          nextPageToken: string  // The next page token.
        }
        ```

      <br />

    - `listCollectionIds(options) => ListCollectionIdsResult`

      List IDs of collections that are children of given document

      - **options** (_object_)

        ```javascript
        {
          documentPath: string;   // (required) Full path of parent document with child collection ids to list ex: '/chatrooms/roomx'
          pageSize: number,       // (optional) Maximum number of ids to return
          pageToken: string,     // (optional) The nextPageToken value returned from a previous listCollectionIds request, if any.
        }
        ```

      - **returns** (object): ListCollectionIdsResult
        ```javascript
        {
          collectionIds: string[],
          idCount: number,
          nextPageToken: string  // The next page token.
        }
        ```

      <br />

    - `rollBack(options) => RollbackResult`

      Roll back a transaction.

      - **options** (_object_)

        ```javascript
        {
          transaction: string; // (required) Transaction to rollback A base64-encoded string
        }
        ```

      - **returns** (object): RollbackResult
        ```javascript
        {
          rolledBack: true;
        }
        ```

      <br />


    - `runQuery(options) => queryResult`

      Run a query against the database.

      - **options** (_object_)

        ```javascript
        {
          structuredQuery: object, // (required) https://cloud.google.com/firestore/docs/reference/rest/v1/StructuredQuery
          documentPath: string,  // (optional)  path relative to documentBasePath

          // (optional)
          consistencySelector: {
            // can be only one of the following:
            transaction: string, // Reads documents in a transaction: A base64-encoded string
            newTransaction: TransactionOptions, // https://cloud.google.com/firestore/docs/reference/rest/v1/TransactionOptions
            readTime: string
          }
        }
        ```

      - **returns** (object): QueryResult
        ```javascript
        {
          documents: Array,
          documentCount:number,
          readTime: string,
          skippedResults: number,
          transaction: string
        }
        ```

      <br />

    - `update(options) => Document`

      Update document in collection by id.

      - **options** (_object_)

        ```javascript
        {
          documentPath: string,  // (required)  document path relative to documentBasePath
          fieldsToReturn: string[], // (optional) array of fields to include in response (mask)
          data: {
            name: string, // (optional) document resource name
            fields: {
              "fieldName": {
                // where 'valueType' is one of https://cloud.google.com/firestore/docs/reference/rest/v1/Value
                valueType: value
              }
            }
          },
          updateOptions: {
            updateAll: boolean, // (optional) update all fields
            fieldsToUpdate: string[], // (optional, required if !updateAll) array of fields to update

            // (optional)
            currentDocument: {
              exists: boolean, // (optional) When set to true, the target document must exist. When set to false, the target document must not exist
              updateTime: string // (optional) Timestamp format When set, the target document must exist and have been last updated at that time
            }
          }
        }
        ```

      - **returns** (_object_): The updated document

      <br />
