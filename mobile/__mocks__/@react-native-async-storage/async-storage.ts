const store: Record<string, string> = {};

export const AsyncStorage = {
  setItem: jest.fn(async (key: string, value: string): Promise<void> => {
    store[key] = value;
  }),

  getItem: jest.fn(async (key: string): Promise<string | null> => {
    return store[key] ?? null;
  }),

  removeItem: jest.fn(async (key: string): Promise<void> => {
    delete store[key];
  }),

  clear: jest.fn(async (): Promise<void> => {
    Object.keys(store).forEach((key) => delete store[key]);
  }),

  getAllKeys: jest.fn(async (): Promise<string[]> => {
    return Object.keys(store);
  }),

  multiGet: jest.fn(
    async (keys: string[]): Promise<Array<[string, string | null]>> => {
      return keys.map((k) => [k, store[k] ?? null]);
    },
  ),

  multiSet: jest.fn(
    async (keyValuePairs: Array<[string, string]>): Promise<void> => {
      keyValuePairs.forEach(([k, v]) => {
        store[k] = v;
      });
    },
  ),

  multiRemove: jest.fn(async (keys: string[]): Promise<void> => {
    keys.forEach((k) => delete store[k]);
  }),
};

export default AsyncStorage;
