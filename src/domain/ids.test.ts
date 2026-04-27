import {
  asInviteId,
  asMembershipId,
  asOrganizationId,
  asProjectId,
  asTagId,
  asTodoId,
  asUserId,
} from './ids.js';

describe('id brands', () => {
  it('preserve the underlying string for every brand', () => {
    expect(asUserId('u-1')).toBe('u-1');
    expect(asTodoId('t-1')).toBe('t-1');
    expect(asTagId('tag-1')).toBe('tag-1');
    expect(asOrganizationId('o-1')).toBe('o-1');
    expect(asProjectId('p-1')).toBe('p-1');
    expect(asMembershipId('m-1')).toBe('m-1');
    expect(asInviteId('i-1')).toBe('i-1');
  });
});
