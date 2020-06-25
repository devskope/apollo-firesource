import { GoogleToken } from 'gtoken';

export const gtoken = new GoogleToken({
  keyFile: process.env.FIRE_SOURCE_CREDS,
  scope: ['https://www.googleapis.com/auth/datastore'],
});
