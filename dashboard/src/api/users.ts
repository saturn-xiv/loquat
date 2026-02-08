import { graphql, type IGraphqlResponse } from "../request";
import type { IOk, IPage, IPagination } from ".";

interface IChangePasswordResponse {
  updateProfile: IOk;
}
export const updateProfile = async (
  current: IAccount,
  new_: IAccount
): Promise<IGraphqlResponse<IChangePasswordResponse>> => {
  const res: IGraphqlResponse<IChangePasswordResponse> = await graphql(
    `
      mutation call($current: Account!, $new: Account!) {
        updateProfile(current: $current, new: $new) {
          createdAt
        }
      }
    `,
    { current, new: new_ }
  );
  return res;
};

interface ISignOutResponse {
  signOut: IOk;
}
export const sign_out = async (): Promise<
  IGraphqlResponse<ISignOutResponse>
> => {
  const res: IGraphqlResponse<ISignOutResponse> = await graphql(
    `
      mutation call {
        signOut {
          createdAt
        }
      }
    `,
    {}
  );
  return res;
};
interface IUser {
  id: string;
  name: string;
}
export interface ILog {
  id: string;
  ip: string;
  message: string;
  user: IUser;
  createdAt: Date;
}

export interface IIndexLogResponse {
  indexLog: { items: ILog[]; pagination: IPagination };
}

export const index_log = async (
  page: IPage
): Promise<IGraphqlResponse<IIndexLogResponse>> => {
  const res: IGraphqlResponse<IIndexLogResponse> = await graphql(
    `
      query call($page: Page!) {
        indexLog(page: $page) {
          items {
            id
            ip
            message
            createdAt
            user {
              id
              name
            }
          }
          pagination {
            index
            size
            total
            hasPrevious
            hasNext
          }
        }
      }
    `,
    { page }
  );
  return res;
};

export interface IAccount {
  name: string;
  password: string;
}
interface ISignInResponse {
  signIn: { username: string; token: string };
}
export const sign_in = async (
  account: IAccount
): Promise<IGraphqlResponse<ISignInResponse>> => {
  const res: IGraphqlResponse<ISignInResponse> = await graphql(
    `
      mutation call($account: Account!, $ttl: Int!) {
        signIn(account: $account, ttl: $ttl) {
          username
          token
        }
      }
    `,
    { account, ttl: 60 * 60 * 24 }
  );
  return res;
};
