# Apollo-Firesource

Apollo server datasource wrapping Firestore REST APIs.

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
      // default values supplied
      {
        projectId, // string: Firestore project ID (required)
        version: 'v1', // string (optional)
        resource: 'databases', // string: <'databases' | 'locations'> (optional)
        database: '(default)', // string (optional)
      }
    ```

  ### Documents - `firestore.documents()`

  - **methods** (_async_):

    - `create(options) => DocumentData`

      Insert new document into a collection.

      - **options** (_object_)

        ```javascript
          {
            collectionId, // string (required)
            docId, // string (optional) custom document id
            fieldsToReturn, // string[] (optional) array of fields to include in response (mask)
            data: {
              name, // string (optional) document resource name

              // where `valueType` below is one of https://cloud.google.com/firestore/docs/reference/rest/v1/Value
              fields: {
                "fieldName": { valueType: value }
              }
            }
          }
        ```

      - **returns** (_object_): The newly created document

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

    - `update(options) => DocumentData`

      Update document in collection by id.

      - **options** (_object_)

        ```javascript
          {
            collectionId, // string (required)
            docId, // string (required)  document id
            fieldsToReturn, // string[] (optional) array of fields to include in response (mask)
            data: {
              name, // string (optional) document resource name

              // where `valueType` below is one of https://cloud.google.com/firestore/docs/reference/rest/v1/Value
              fields: {
                "fieldName": { valueType: value }
              }
            },
            updateOptions: {
               updateAll, // boolean (optional) update all fields
               fieldsToUpdate, // string[] (optional, required if !updateAll) array of fields to update
               currentDocument: {
                 exists, // boolean (optional) When set to true, the target document must exist. When set to false, the target document must not exist
                 updateTime, // string  (Timestamp format) When set, the target document must exist and have been last updated at that time
               }
            }
          }
        ```

      - **returns** (_object_): The updated document

      <br />
