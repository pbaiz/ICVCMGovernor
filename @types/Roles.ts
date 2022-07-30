export enum Roles {
  Director = 0,
  Expert,
  Secretariat,
  Regulator,
}

export type Member = {
  role: Roles;
  name: string;
  memberAddress: string;
};
