import type { IOk } from ".";
import { graphql, type IGraphqlResponse } from "../request";

export interface IIntranetBond {
  interfaces: string[];
  address: string;
  enable: string;
  dns: string;
}

interface IGetBondDmzResponse {
  bondDmz: IIntranetBond;
}
export const getBondDmz = async (): Promise<
  IGraphqlResponse<IGetBondDmzResponse>
> => {
  const res: IGraphqlResponse<IGetBondDmzResponse> = await graphql(
    `
      query call {
        bondDmz {
          interfaces
          address
          enable
          dns
        }
      }
    `,
    {},
  );
  return res;
};

interface IGetBondLanResponse {
  bondLan: IIntranetBond;
}
export const getBondLan = async (): Promise<
  IGraphqlResponse<IGetBondLanResponse>
> => {
  const res: IGraphqlResponse<IGetBondLanResponse> = await graphql(
    `
      query call {
        bondLan {
          interfaces
          address
          enable
          dns
        }
      }
    `,
    {},
  );
  return res;
};

export interface INetworkInterface {
  name: string;
  hardwareAddress: string;
  addresses: string[];
  multicastAddresses: string[];
  mtu: number;
  label: string;
  memo: string;
}

interface ISystemStatus {
  diskSpace: string;
  diskIndexNodes: string;
  cpu: string;
  memory: string;
  top: string;
  sar: string;
  network: string;
  hardware: string;
  arp: string;
  routes: string;
  addresses: string;
  tcp: string;
  udp: string;
  queueingDiscipline: string;
  firewall: string;
}

export interface IStatusResponse {
  indexNetworkInterface: INetworkInterface[];
  status: ISystemStatus;
}
export const status = async (): Promise<IGraphqlResponse<IStatusResponse>> => {
  const res: IGraphqlResponse<IStatusResponse> = await graphql(
    `
      query call {
        indexNetworkInterface {
          name
          hardwareAddress
          addresses
          multicastAddresses
          mtu
          label
          memo
        }
        status {
          cpu
          memory
          top
          network
          sar
          diskSpace
          diskIndexNodes
          hardware
          arp
          routes
          addresses
          tcp
          udp
          queueingDiscipline
          firewall
        }
      }
    `,
    {},
  );
  return res;
};
interface IRebootResponse {
  reboot: IOk;
}
export const reboot = async (): Promise<IGraphqlResponse<IRebootResponse>> => {
  const res: IGraphqlResponse<IRebootResponse> = await graphql(
    `
      mutation call {
        reboot {
          createdAt
        }
      }
    `,
    {},
  );
  return res;
};

interface IApplyResponse {
  apply: IOk;
}
export const apply = async (
  run: boolean,
): Promise<IGraphqlResponse<IApplyResponse>> => {
  const res: IGraphqlResponse<IApplyResponse> = await graphql(
    `
      mutation call($run: Boolean!) {
        apply(run: $run) {
          createdAt
        }
      }
    `,
    { run },
  );
  return res;
};
