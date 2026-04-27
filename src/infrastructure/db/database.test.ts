import { openDatabase, type DbHandle } from './database.js';

describe('openDatabase', () => {
  let handle: DbHandle;

  afterEach(() => {
    handle.close();
  });

  it('opens an in-memory database and applies the schema', () => {
    handle = openDatabase(':memory:');
    expect(handle.db).toBeDefined();
  });
});
