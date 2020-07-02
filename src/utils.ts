import { GoogleToken } from 'gtoken';

export const gtoken = new GoogleToken({
  keyFile: process.env.FIRE_SOURCE_CREDS,
  scope: ['https://www.googleapis.com/auth/datastore'],
});

export const buildQueryString = (
  path: string,
  queryKey: string,
  value: string
): string => {
  if (!path.includes('?')) path += '?';
  if (!path.endsWith('?')) path += '&';

  path += `${queryKey}=${value}`;

  return path;
};

export const buildRecursiveQueryString = (
  path: string,
  queryKey: string,
  valueArray: string[]
): string => {
  if (!path.includes('?')) path += '?';
  if (!path.endsWith('?')) path += '&';

  valueArray.forEach((value) => (path += `${queryKey}=${value}&`));

  return path.endsWith('&') ? path.slice(0, -1) : path;
};
