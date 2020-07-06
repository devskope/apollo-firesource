import { AuthenticationError } from 'apollo-server-errors';
import { GoogleToken } from 'gtoken';

if (!process.env.FIRESOURCE_CREDENTIALS) {
  throw new AuthenticationError(
    'env variable "FIRESOURCE_CREDENTIALS" must be set to use apollo-fireSource'
  );
}
const gtoken = new GoogleToken({
  keyFile: process.env.FIRESOURCE_CREDENTIALS,
  scope: ['https://www.googleapis.com/auth/datastore'],
});

export default gtoken;
