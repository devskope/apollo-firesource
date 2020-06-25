import { GoogleToken } from 'gtoken';

export const gtoken = new GoogleToken({
  keyFile: process.env.FIRE_SOURCE_CREDS,
  scope: ['https://www.googleapis.com/auth/datastore'],
});

export const buildRecursiveQueryString = (
  path: string,
  queryKey: string,
  valueArray: string[]
): string => {
  if (!path.includes('?')) path += '?';

  valueArray.forEach((value) => (path += `${queryKey}=${value}&`));

  return path.endsWith('&') ? path.slice(0, -1) : path;
};
