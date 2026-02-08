import { graphql, type IGraphqlResponse } from "../request";

export interface IOk {
  createdAt: Date;
}

export interface IPage {
  size: number;
  index: number;
}

export interface IPagination {
  size: number;
  index: number;
  total: number;
  pages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface IRefreshResponse {
  refresh: {
    createdAt: Date;
    version: string;
    hostname: string;
    description: string;
  };
}

export const refresh = async (): Promise<
  IGraphqlResponse<IRefreshResponse>
> => {
  const res: IGraphqlResponse<IRefreshResponse> = await graphql(
    `
      {
        refresh {
          hostname
          description
          version
        }
      }
    `,
    {}
  );
  return res;
};
