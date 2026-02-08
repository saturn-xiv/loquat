import { graphql, type IGraphqlResponse } from "../request";
import type { IOk } from ".";

export interface IMember {
  id: string;
  sn: string;
  name: string;
  memo: string;
  deletedAt?: Date;
  updatedAt: Date;
}
interface ICreateResponse {
  createMember: IOk;
}
export const create = async (
  sn: string,
  name: string,
  memo: string
): Promise<IGraphqlResponse<ICreateResponse>> => {
  const res: IGraphqlResponse<ICreateResponse> = await graphql(
    `
      mutation call($sn: String!, $name: String!, $memo: String!) {
        createMember(sn: $sn, name: $name, memo: $memo) {
          createdAt
        }
      }
    `,
    { sn, name, memo }
  );
  return res;
};
interface IUpdateResponse {
  updateMember: IOk;
}
export const update = async (
  id: string,
  name: string,
  memo: string
): Promise<IGraphqlResponse<IUpdateResponse>> => {
  const res: IGraphqlResponse<IUpdateResponse> = await graphql(
    `
      mutation call($id: ID!, $name: String!, $memo: String!) {
        updateMember(id: $id, name: $name, memo: $memo) {
          createdAt
        }
      }
    `,
    { id, name, memo }
  );
  return res;
};
interface ISetWifiPasswordResponse {
  setMemberWifiPassword: IOk;
}
export const set_wifi_password = async (
  id: string,
  password: string
): Promise<IGraphqlResponse<ISetWifiPasswordResponse>> => {
  const res: IGraphqlResponse<ISetWifiPasswordResponse> = await graphql(
    `
      mutation call($id: ID!, $password: String!) {
        setMemberWifiPassword(id: $id, password: $password) {
          createdAt
        }
      }
    `,
    { id, password }
  );
  return res;
};
interface IEnableResponse {
  enableMember: IOk;
}
export const enable = async (
  id: string
): Promise<IGraphqlResponse<IEnableResponse>> => {
  const res: IGraphqlResponse<IEnableResponse> = await graphql(
    `
      mutation call($id: ID!) {
        enableMember(id: $id) {
          createdAt
        }
      }
    `,
    { id }
  );
  return res;
};
interface IDisableResponse {
  disableMember: IOk;
}
export const disable = async (
  id: string
): Promise<IGraphqlResponse<IDisableResponse>> => {
  const res: IGraphqlResponse<IDisableResponse> = await graphql(
    `
      mutation call($id: ID!) {
        disableMember(id: $id) {
          createdAt
        }
      }
    `,
    { id }
  );
  return res;
};
interface IIndexResponse {
  indexMember: IMember[];
}
export const index = async (): Promise<IGraphqlResponse<IIndexResponse>> => {
  const res: IGraphqlResponse<IIndexResponse> = await graphql(
    `
      query call {
        indexMember {
          id
          sn
          name
          memo
          updatedAt
          deletedAt
        }
      }
    `,
    {}
  );
  return res;
};
