import type { IOk } from ".";
import { graphql, type IGraphqlResponse } from "../request";

export const NAT_RULE = "Nat";
export const INPUT_RULE = "Input";
export const PING_RULE = "Ping";
export const TCP = "TCP";
export const UDP = "UDP";
export const protocol = (tcp?: boolean): string => {
  return tcp ? TCP : UDP;
};

interface IAllowNatResponse {
  allowNat: IOk;
}

export const allow_nat = async (
  id: string | undefined,
  device: string,
  tcp: boolean,
  port: number,
  destinationIp: string,
  destinationPort: number,
  sortOrder: number,
  memo: string
): Promise<IGraphqlResponse<IAllowNatResponse>> => {
  const res: IGraphqlResponse<IAllowNatResponse> = await graphql(
    `
      mutation call(
        $id: ID
        $device: String!
        $tcp: Boolean!
        $port: Int!
        $destinationIp: String!
        $destinationPort: Int!
        $sortOrder: Int!
        $memo: String!
      ) {
        allowNat(
          id: $id
          device: $device
          tcp: $tcp
          port: $port
          destinationIp: $destinationIp
          destinationPort: $destinationPort
          sortOrder: $sortOrder
          memo: $memo
        ) {
          createdAt
        }
      }
    `,
    { id, device, tcp, port, destinationIp, destinationPort, sortOrder, memo }
  );
  return res;
};

interface IAllowPingResponse {
  allowPing: IOk;
}

export const allow_ping = async (
  id: string | undefined,
  device: string,
  sortOrder: number,
  memo: string
): Promise<IGraphqlResponse<IAllowPingResponse>> => {
  const res: IGraphqlResponse<IAllowPingResponse> = await graphql(
    `
      mutation call(
        $id: ID
        $device: String!
        $sortOrder: Int!
        $memo: String!
      ) {
        allowPing(
          id: $id
          device: $device
          sortOrder: $sortOrder
          memo: $memo
        ) {
          createdAt
        }
      }
    `,
    { id, device, sortOrder, memo }
  );
  return res;
};

interface IAllowInputResponse {
  allowInput: IOk;
}

export const allow_input = async (
  id: string | undefined,
  device: string,
  tcp: boolean,
  port: number,
  sortOrder: number,
  memo: string
): Promise<IGraphqlResponse<IAllowInputResponse>> => {
  const res: IGraphqlResponse<IAllowInputResponse> = await graphql(
    `
      mutation call(
        $id: ID
        $device: String!
        $tcp: Boolean!
        $port: Int!
        $sortOrder: Int!
        $memo: String!
      ) {
        allowInput(
          id: $id
          device: $device
          tcp: $tcp
          port: $port
          sortOrder: $sortOrder
          memo: $memo
        ) {
          createdAt
        }
      }
    `,
    { id, device, tcp, port, sortOrder, memo }
  );
  return res;
};
interface IDisableResponse {
  disableFirewallRule: IOk;
}
export const disable = async (
  id: string
): Promise<IGraphqlResponse<IDisableResponse>> => {
  const res: IGraphqlResponse<IDisableResponse> = await graphql(
    `
      mutation call($id: ID!) {
        disableFirewallRule(id: $id) {
          createdAt
        }
      }
    `,
    { id }
  );
  return res;
};
interface IEnableResponse {
  enableFirewallRule: IOk;
}
export const enable = async (
  id: string
): Promise<IGraphqlResponse<IEnableResponse>> => {
  const res: IGraphqlResponse<IEnableResponse> = await graphql(
    `
      mutation call($id: ID!) {
        enableFirewallRule(id: $id) {
          createdAt
        }
      }
    `,
    { id }
  );
  return res;
};

export interface IInputRule {
  __typename: string;
  id: string;
  device: string;
  tcp: boolean;
  port: number;
  sortOrder: number;
  memo: string;
  updatedAt: Date;
  deletedAt?: Date;
}
export interface INatRule {
  __typename: string;
  id: string;
  device: string;
  port: number;
  tcp: boolean;
  destinationIp: string;
  destinationPort: number;
  sortOrder: number;
  memo: string;
  updatedAt: Date;
  deletedAt?: Date;
}
export interface IPingRule {
  __typename: string;
  id: string;
  device: string;
  sortOrder: number;
  memo: string;
  updatedAt: Date;
  deletedAt?: Date;
}

export type IRule = IInputRule | IPingRule | INatRule;

export interface IIndexResponse {
  indexFirewallRule: IRule[];
}

export const index = async (): Promise<IGraphqlResponse<IIndexResponse>> => {
  const res: IGraphqlResponse<IIndexResponse> = await graphql(
    `
      query call {
        indexFirewallRule {
          __typename
          ... on Ping {
            id
            device
            sortOrder
            memo
            updatedAt
            deletedAt
          }
          ... on Input {
            id
            device
            tcp
            port
            sortOrder
            memo
            updatedAt
            deletedAt
          }
          ... on Nat {
            id
            device
            tcp
            port
            destinationIp
            destinationPort
            sortOrder
            memo
            updatedAt
            deletedAt
          }
        }
      }
    `,
    {}
  );
  return res;
};
