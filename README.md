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
    user: async (parent, args, ctx) => {
      const { collectionId, docId } = args;
      const { dataSources:{ firestore } } = ctx;

      try {
      const user = firestore.getDocument({ collectionId, docId });
      return user;
      } catch (error) {
        //handle error
      }
    },
  },
  ```

  ## API

  ### Constructor - `new FireStore(config)`:

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
