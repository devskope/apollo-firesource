# Apollo-Firesource

Apollo server datasource wrapping Firestore REST APIs. &nbsp;&nbsp; [PRs welcome 😊]

## Basic Usage

- Set required environment variables:

  - `FIRE_SOURCE_CREDS=<Path-to-service-account-json>` // must have firestore access

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
      const { collectionId, docId } = args;
      const { dataSources: { firestore } } = ctx;

      try {
        // get document by id from collection
        return firestore.documents().get({ collectionId, docId });
      } catch (error) {
        // handle error
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

  - **methods** (_async_):

    - `batchGet(options) => batchGetResult`

      Get multiple documents from database.

      - **options** (_object_)

        ```javascript
        {
          documents: { collectionId: string; docId: string }[], // (required) Array of { collectionId, docId } objects to build document paths from
          fieldsToReturn: string[], // (optional) array of document fields to include in response

          // (optional)
          consistencySelector: {
            // can be only one of the following:
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


    - `create(options) => DocumentData`

      Insert new document into a collection.

      - **options** (_object_)

        ```javascript
        {
          collectionId: string, // (required)
          docId: string // (optional) custom document id
          fieldsToReturn: string[] // (optional) array of fields to include in response (mask)
          data: {
            name: string // (optional) document resource name
            fields: {
              "fieldName": {
                // where 'valueType' is one of https://cloud.google.com/firestore/docs/reference/rest/v1/Value
                valueType: value
              }
            }
          }
        }
        ```

      - **returns** (_object_): The newly created document

      <br />

    - `delete(options) => object`

      Delete document from collection.

      - **options** (_object_)

        ```javascript
        {
          collectionId: string, // (required)
          docId: string, // (required)

          // (optional)
          currentDocument: {
            exists: boolean, // (optional) When set to true, the target document must exist. When set to false, the target document must not exist
            updateTime: string // (optional) Timestamp format: When set, the target document must exist and have been last updated at that time
          }
        }
        ```

      - **returns** (_object_):
        ```javascript
        {
          deleted: boolean
        }
        ```

      <br />

    - `get(options) => DocumentData | DocumentData[]`

      Retrieve one or all documents from a collection.

      - **options** (_object_)
        ```javascript
        {
          collectionId, // string (required)
          docId, // string (optional) id of single doc to retrieve
          fieldsToReturn, // string[] (optional) array of fields to include in response (mask)
        }
        ```
      - **returns** (_object | Array_): Documents matching provided options or an empty array if none.

      <br />

    - `runQuery(options) => queryResult`

      Run a query against the database.

      - **options** (_object_)

        ```javascript
        {
          collectionId: string, // (optional)
          docId: string, // (optional)

          // (required) https://cloud.google.com/firestore/docs/reference/rest/v1/StructuredQuery
          structuredQuery: object,

          // (optional)
          consistencySelector: {
            // can be only one of the following:
            transaction: string, // Reads documents in a transaction: A base64-encoded
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

    - `update(options) => DocumentData`

      Update document in collection by id.

      - **options** (_object_)

        ```javascript
        {
          collectionId: string, // (required)
          docId: string, // (required)  document id
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
