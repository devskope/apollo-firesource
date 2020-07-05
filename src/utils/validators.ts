import { UserInputError } from 'apollo-server-errors';

export const inputError = (message: string) => {
  const error = new UserInputError(message);
  throw error;
};

interface validateSubPathOptions {
  path: string;
  name: string;
  idx?: number;
  collection?: string;
}

export const validateSubPath = (options: validateSubPathOptions) => {
  const { path, name, idx, collection } = options;
  if (
    !(typeof path === 'string') ||
    !path.startsWith('/') ||
    path.endsWith('/')
  ) {
    if (idx && collection) {
      const message = `${name} at index ${idx} of ${collection} must start with and not end with '/'`;
      inputError(message);
    }

    inputError(`${name} must start with and not end with '/'`);
  }
};

export default validateSubPath;
