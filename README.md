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
      const { dataSources:{ firestore } } = ctx;

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
