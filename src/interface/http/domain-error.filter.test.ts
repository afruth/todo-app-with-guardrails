import { jest } from '@jest/globals';
import {
  ConflictError,
  DomainError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../domain/errors.js';
import { DomainErrorFilter } from './domain-error.filter.js';

interface FakeResponse {
  status: ReturnType<typeof jest.fn>;
  json: ReturnType<typeof jest.fn>;
}

const makeHost = (): {
  host: { switchToHttp: () => { getResponse: () => FakeResponse } };
  res: FakeResponse;
} => {
  const res: FakeResponse = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return {
    res,
    host: {
      switchToHttp: (): { getResponse: () => FakeResponse } => ({
        getResponse: (): FakeResponse => res,
      }),
    },
  };
};

describe('DomainErrorFilter', () => {
  const filter = new DomainErrorFilter();

  it('maps ValidationError to 400', () => {
    const { host, res } = makeHost();
    filter.catch(new ValidationError('bad'), host as never);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('maps UnauthorizedError to 401', () => {
    const { host, res } = makeHost();
    filter.catch(new UnauthorizedError('nope'), host as never);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('maps NotFoundError to 404', () => {
    const { host, res } = makeHost();
    filter.catch(new NotFoundError('missing'), host as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('maps ConflictError to 409', () => {
    const { host, res } = makeHost();
    filter.catch(new ConflictError('dup'), host as never);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('maps a plain DomainError to 400', () => {
    const { host, res } = makeHost();
    filter.catch(new DomainError('oops'), host as never);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'DomainError', message: 'oops' });
  });
});
