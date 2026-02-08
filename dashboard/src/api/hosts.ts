import ipaddr from "ipaddr.js";

import { graphql, type IGraphqlResponse } from "../request";
import type { IOk } from ".";
import type { IMember } from "./members";

const ipv4_to_number = (ip: ipaddr.IPv4): number => {
  const buf = ip.toByteArray();
  return (
    ((buf[0] << 24) >>> 0) |
    ((buf[1] << 16) >>> 0) |
    ((buf[2] << 8) >>> 0) |
    (buf[3] >>> 0)
  );
};

const number_to_ipv4 = (iv: number): ipaddr.IPv4 | undefined => {
  const buf = [
    (iv >>> 24) & 0xff,
    (iv >>> 16) & 0xff,
    (iv >>> 8) & 0xff,
    iv & 0xff,
  ];
  const it = ipaddr.fromByteArray(buf);

  if (it instanceof ipaddr.IPv4) {
    return it;
  }
  return undefined;
};

interface IAddressesResponse {
  addresses: string[];
}
export const addresses = async (
  ip: string,
): Promise<IGraphqlResponse<IAddressesResponse>> => {
  // const res: IGraphqlResponse<IAddressesResponse> = await graphql(
  //   `
  //     query call($ip: String!) {
  //       addresses(ip: $ip)
  //     }
  //   `,
  //   { ip },
  // );

  const addresses: string[] = [];
  const first = ipv4_to_number(ipaddr.IPv4.networkAddressFromCIDR(ip));
  const last = ipv4_to_number(ipaddr.IPv4.broadcastAddressFromCIDR(ip));
  for (let i = first + 2; i < last; i++) {
    const v = number_to_ipv4(i);
    if (v) {
      addresses.push(v.toString());
    }
  }

  return new Promise((resolve) => {
    resolve({ data: { addresses } });
  });
};

interface ISetStaticIpResponse {
  setHostStaticIp: IOk;
}

export const set_static_ip = async (
  id: string,
  name: string,
  ip: string,
): Promise<IGraphqlResponse<ISetStaticIpResponse>> => {
  const res: IGraphqlResponse<ISetStaticIpResponse> = await graphql(
    `
      mutation call($id: ID!, $name: String!, $ip: String!) {
        setHostStaticIp(id: $id, name: $name, ip: $ip) {
          createdAt
        }
      }
    `,
    { id, name, ip },
  );
  return res;
};
interface ISetDynamicIpResponse {
  setHostDynamicIp: IOk;
  setHostName: IOk;
}

export const set_dynamic_ip = async (
  id: string,
  name: string,
): Promise<IGraphqlResponse<ISetDynamicIpResponse>> => {
  const res: IGraphqlResponse<ISetDynamicIpResponse> = await graphql(
    `
      mutation call($id: ID!, $name: String!) {
        setHostDynamicIp(id: $id) {
          createdAt
        }
        setHostName(id: $id, name: $name) {
          createdAt
        }
      }
    `,
    { id, name },
  );
  return res;
};
interface ISetHostNameResponse {
  setHostName: IOk;
}

export const set_name = async (
  id: string,
  name: string,
): Promise<IGraphqlResponse<ISetHostNameResponse>> => {
  const res: IGraphqlResponse<ISetHostNameResponse> = await graphql(
    `
      mutation call($id: ID!, $name: String!) {
        setHostName(id: $id, name: $name) {
          createdAt
        }
      }
    `,
    { id, name },
  );
  return res;
};

interface IReleaseResponse {
  releaseHost: IOk;
}

export const release = async (
  id: string,
): Promise<IGraphqlResponse<IReleaseResponse>> => {
  const res: IGraphqlResponse<IReleaseResponse> = await graphql(
    `
      mutation call($id: ID!) {
        releaseHost(id: $id) {
          createdAt
        }
      }
    `,
    { id },
  );
  return res;
};
interface IBlockResponse {
  blockHost: IOk;
}

export const block = async (
  id: string,
): Promise<IGraphqlResponse<IBlockResponse>> => {
  const res: IGraphqlResponse<IBlockResponse> = await graphql(
    `
      mutation call($id: ID!) {
        blockHost(id: $id) {
          createdAt
        }
      }
    `,
    { id },
  );
  return res;
};
interface IAssociateHostWithMemberResponse {
  associateHostWithMember: IOk;
}

export const associate_with_member = async (
  host: string,
  member: string,
): Promise<IGraphqlResponse<IAssociateHostWithMemberResponse>> => {
  const res: IGraphqlResponse<IAssociateHostWithMemberResponse> = await graphql(
    `
      mutation call($host: ID!, $member: ID!) {
        associateHostWithMember(host: $host, member: $member) {
          createdAt
        }
      }
    `,
    { host, member },
  );
  return res;
};
export interface IHost {
  id: string;
  name: string;
  vendor: string;
  mac: string;
  ip: string;
  network: string;
  fixed: boolean;
  member?: IMember;
  deletedAt?: Date;
  updatedAt: Date;
}

interface IIndexResponse {
  indexHost: IHost[];
}
export const index = async (): Promise<IGraphqlResponse<IIndexResponse>> => {
  const res: IGraphqlResponse<IIndexResponse> = await graphql(
    `
      query call {
        indexHost {
          id
          name
          vendor
          mac
          ip
          network
          fixed
          member {
            id
            sn
            name
            memo
          }
          updatedAt
          deletedAt
        }
      }
    `,
    {},
  );
  return res;
};
