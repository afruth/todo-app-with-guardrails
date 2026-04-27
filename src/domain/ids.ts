declare const userIdBrand: unique symbol;
declare const todoIdBrand: unique symbol;
declare const tagIdBrand: unique symbol;
declare const orgIdBrand: unique symbol;
declare const projectIdBrand: unique symbol;
declare const memberIdBrand: unique symbol;
declare const inviteIdBrand: unique symbol;

export type UserId = string & { readonly [userIdBrand]: 'UserId' };
export type TodoId = string & { readonly [todoIdBrand]: 'TodoId' };
export type TagId = string & { readonly [tagIdBrand]: 'TagId' };
export type OrganizationId = string & { readonly [orgIdBrand]: 'OrganizationId' };
export type ProjectId = string & { readonly [projectIdBrand]: 'ProjectId' };
export type MembershipId = string & { readonly [memberIdBrand]: 'MembershipId' };
export type InviteId = string & { readonly [inviteIdBrand]: 'InviteId' };

export const asUserId = (value: string): UserId => value as UserId;
export const asTodoId = (value: string): TodoId => value as TodoId;
export const asTagId = (value: string): TagId => value as TagId;
export const asOrganizationId = (value: string): OrganizationId =>
  value as OrganizationId;
export const asProjectId = (value: string): ProjectId => value as ProjectId;
export const asMembershipId = (value: string): MembershipId =>
  value as MembershipId;
export const asInviteId = (value: string): InviteId => value as InviteId;
