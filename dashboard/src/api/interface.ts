import type { IOk } from ".";
import { graphql, type IGraphqlResponse } from "../request";

export const LAN = "bond-lan";
export const DMZ = "bond-dmz";

interface IInterfaces {
  lan?: IIntranetBond;
  dmz?: IIntranetBond;
  ethernets: IEthernet[];
}
export interface IEthernet {
  name: string;
  profile?: IEthernetProfile;
}
interface IInterfacesResponse {
  interfaces: IInterfaces;
}
export const interfaces = async (): Promise<
  IGraphqlResponse<IInterfacesResponse>
> => {
  const res: IGraphqlResponse<IInterfacesResponse> = await graphql(
    `
      query call {
        interfaces {
          dmz {
            interfaces
            address
            dns
            enable
          }
          lan {
            interfaces
            address
            dns
            enable
          }
          ethernets {
            name
            profile {
              __typename
              ... on StaticIp {
                label
                isp
                address
                netmask
                gateway
                dns
                memo
                priority
                enable
              }
              ... on DynamicIp {
                label
                isp
                memo
                priority
                enable
              }
            }
          }
        }
      }
    `,
    {},
  );
  return res;
};

export interface IIntranetBond {
  interfaces: string[];
  address: string;
  dns: string;
  mode: string;
  enable: boolean;
}
interface IGetIntranetBondResponse {
  intranetBond: IIntranetBond;
}
export const get_intranet_bond = async (
  name: string,
): Promise<IGraphqlResponse<IGetIntranetBondResponse>> => {
  const res: IGraphqlResponse<IGetIntranetBondResponse> = await graphql(
    `
      query call($name: String!) {
        intranetBond(name: $name) {
          interfaces
          address
          dns
          mode
          enable
        }
      }
    `,
    { name },
  );
  return res;
};

interface ISetIntranetBondResponse {
  intranetBond: IOk;
}
export const set_intranet_bond = async (
  name: string,
  interfaces: string[],
  address: string,
  dns: string,
  mode: string,
  enable: boolean,
): Promise<IGraphqlResponse<ISetIntranetBondResponse>> => {
  const res: IGraphqlResponse<ISetIntranetBondResponse> = await graphql(
    `
      mutation call(
        $name: String!
        $interfaces: [String!]!
        $address: String!
        $dns: Dns!
        $mode: BondMode!
        $enable: Boolean!
      ) {
        intranetBond(
          name: $name
          interfaces: $interfaces
          address: $address
          dns: $dns
          mode: $mode
          enable: $enable
        ) {
          createdAt
        }
      }
    `,
    { name, interfaces, address, dns, mode, enable },
  );
  return res;
};

interface ISetInterfaceStaticIpResponse {
  setNetworkInterfacePublicStaticIp: IOk;
}
export const set_interface_static_ip = async (
  name: string,
  label: string,
  isp: string,
  address: string,
  netmask: string,
  gateway: string,
  dns: string[],
  memo: string,
  priority: number,
): Promise<IGraphqlResponse<ISetInterfaceStaticIpResponse>> => {
  const res: IGraphqlResponse<ISetInterfaceStaticIpResponse> = await graphql(
    `
      mutation call(
        $name: String!
        $label: String!
        $isp: Isp!
        $address: String!
        $netmask: String!
        $gateway: String!
        $dns: [String!]!
        $memo: String!
        $priority: Int!
      ) {
        setNetworkInterfacePublicStaticIp(
          name: $name
          label: $label
          isp: $isp
          address: $address
          netmask: $netmask
          gateway: $gateway
          dns: $dns
          memo: $memo
          priority: $priority
        ) {
          createdAt
        }
      }
    `,
    { name, label, isp, address, netmask, gateway, dns, memo, priority },
  );
  return res;
};

interface ISetInterfaceDhcpResponse {
  setNetworkInterfacePublicDhcp: IOk;
}
export const set_interface_dhcp = async (
  name: string,
  label: string,
  isp: string,
  memo: string,
  priority: number,
): Promise<IGraphqlResponse<ISetInterfaceDhcpResponse>> => {
  console.log("priority", priority);
  const res: IGraphqlResponse<ISetInterfaceDhcpResponse> = await graphql(
    `
      mutation call(
        $name: String!
        $label: String!
        $isp: Isp!
        $memo: String!
        $priority: Int!
      ) {
        setNetworkInterfacePublicDhcp(
          name: $name
          label: $label
          isp: $isp
          memo: $memo
          priority: $priority
        ) {
          createdAt
        }
      }
    `,
    { name, label, isp, memo, priority },
  );
  return res;
};

interface IDisableInterfaceResponse {
  disableNetworkInterface: IOk;
}
export const disable_interface = async (
  name: string,
  label: string,
): Promise<IGraphqlResponse<IDisableInterfaceResponse>> => {
  const res: IGraphqlResponse<IDisableInterfaceResponse> = await graphql(
    `
      mutation call($name: String!, $label: String!) {
        disableNetworkInterface(name: $name, label: $label) {
          createdAt
        }
      }
    `,
    { name, label },
  );
  return res;
};

export interface IDhcp {
  __typename: string;
  label: string;
  isp: string;
  memo: string;
  priority: number;
  enable: boolean;
}

export interface IStaticIp {
  __typename: string;
  label: string;
  isp: string;
  address: string;
  netmask: string;
  gateway: string;
  dns: string[];
  memo: string;
  priority: number;
  enable: boolean;
}

type IEthernetProfile = IStaticIp | IDhcp;

interface IGetNetworkInterfaceResponse {
  getNetworkInterface: IEthernetProfile;
}

export const get_interface = async (
  name: string,
): Promise<IGraphqlResponse<IGetNetworkInterfaceResponse>> => {
  const res: IGraphqlResponse<IGetNetworkInterfaceResponse> = await graphql(
    `
      query call($name: String!) {
        getNetworkInterface(name: $name) {
          __typename
          ... on StaticIp {
            label
            isp
            address
            netmask
            gateway
            dns
            memo
            enable
          }
          ... on DynamicIp {
            label
            isp
            memo
            enable
          }
        }
      }
    `,
    { name },
  );
  return res;
};
