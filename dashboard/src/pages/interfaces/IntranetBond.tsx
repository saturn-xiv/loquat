import { FormattedMessage, useIntl } from "react-intl";
import * as Yup from "yup";
import { withFormik, type FormikProps, Form, Field } from "formik";
import { useCallback, useEffect, useState } from "react";

import {
  get_intranet_bond,
  set_intranet_bond,
  type IEthernet,
  type IIntranetBond,
} from "../../api/interface";
import {
  NotificationBar,
  type INotificationBarState,
} from "../../components/NotificationBar";
import { useAppDispatch } from "../../hooks";
import { danger as show_danger } from "../../reducers/notification";

const DEFAULT_ADDRESS = "192.168.0.1/24";
const DNS_GOOGLE = "Google";
const DNS_ALI = "Ali";
const BALANCE_XOR = "BalanceXor";
const BALANCE_ALB = "BalanceAlb";

export const BalanceAlb = () => (
  <>
    <div className="block">
      <strong>mode 6 (balance-alb)</strong>
      <br />
      Adaptive load balancing. Includes balance-transmit load balancing plus
      receive-load balancing for IPv4 traffic, and does not require any special
      switch support. The receive-load balancing is achieved by ARP negotiation.
      The bonding driver intercepts the ARP replies sent by the local system on
      their way out and overwrites the source hardware address with the unique
      hardware address of one of the slaves in the bond. Thus, different peers
      use different hardware addresses for the server.
    </div>
  </>
);

export const BalanceXor = () => (
  <>
    <div className="block">
      <strong>mode 2 (balance-xor)</strong>
      <br />
      Transmits based on the selected transmit hash policy, which can be altered
      via the <em>xmit_hash_policy</em> option. This mode provides load
      balancing and fault tolerance.
    </div>
  </>
);
interface IProps {
  name: string;
  devices: IEthernet[];
}

// https://www.speedtest.cn/tools/ipCalculator
// 192.168.0~254.1/24~26
// 172.16~31.0~254.0/16~24

/*
A: 10.0.0.0～10.255.255.255 
B: 172.16.0.0～172.31.255.255 
C: 192.168.0.0～192.168.255.255 
*/

const addresses_range = (): string[] => {
  const items = [""];
  for (let i = 0; i < 255; i++) {
    items.push(`192.168.${i}.1/24`);
  }
  for (let i = 16; i < 32; i++) {
    items.push(`172.${i}.0.1/16`);
  }
  return items;
};

interface IFormValues {
  // ip1: number;
  // ip2: number;
  // ip3: number;
  // ip4: number;
  // cidr: number;
  address: string;
  interfaces: string[];
  dns: string;
  mode: string;
  enable: boolean;
}

const InnerForm = (
  props: {
    devices: IEthernet[];
    onSubmit: (value: IFormValues) => Promise<void>;
  } & FormikProps<IFormValues>,
) => {
  const { devices, values, isSubmitting } = props;
  return (
    <Form>
      <div className="field">
        <div className="control">
          <label className="checkbox">
            <Field type="checkbox" name="enable" />
            <FormattedMessage id="buttons.enable" />
          </label>
        </div>
      </div>
      {values.enable && (
        <div className="field">
          <div className="control">
            <div className="checkboxes">
              {devices.map((it, id) => (
                <label key={id} className="checkbox">
                  <Field type="checkbox" name="interfaces" value={it.name} />
                  {it.name}-{it.profile?.label || ""}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {values.enable && (
        <div className="field">
          <label className="label">
            <FormattedMessage id="forms.fields.label.owner" />
          </label>
          <div className="control">
            <div className="select">
              <Field name="address" component="select">
                {addresses_range().map((it, id) => (
                  <option key={id} value={it}>
                    {it}
                  </option>
                ))}
              </Field>
            </div>
          </div>
        </div>
      )}

      {values.enable && (
        <div className="field">
          <label className="label">
            <FormattedMessage id="intranet-bond.dns" />
          </label>
          <div className="control">
            <div className="radios">
              {[DNS_ALI, DNS_GOOGLE].map((it, id) => (
                <label className="radio" key={id}>
                  <Field type="radio" name="dns" value={it} />
                  {it}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {values.enable && (
        <div className="field">
          <label className="label">
            <FormattedMessage id="intranet-bond.mode" />
          </label>
          <div className="control">
            <div className="radios">
              {[BALANCE_XOR, BALANCE_ALB].map((it, id) => (
                <label className="radio" key={id}>
                  <Field type="radio" name="mode" value={it} />
                  {it}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="field is-grouped">
        <div className="control">
          <button
            className="button is-link"
            type="submit"
            disabled={isSubmitting}
          >
            <FormattedMessage id="buttons.submit" />
          </button>
        </div>
        <div className="control">
          <button type="reset" className="button is-link is-light">
            <FormattedMessage id="buttons.reset" />
          </button>
        </div>
      </div>
    </Form>
  );
};

const IForm = withFormik<
  {
    devices: IEthernet[];
    bond?: IIntranetBond;
    onSubmit: (value: IFormValues) => Promise<void>;
  },
  IFormValues
>({
  mapPropsToValues: (props) => {
    return {
      enable: props.bond?.enable || false,
      interfaces: props.bond?.interfaces || [],
      address: props.bond?.address || DEFAULT_ADDRESS,
      dns: props.bond?.dns || DNS_ALI,
      mode: props.bond?.mode || BALANCE_ALB,
    };
  },
  enableReinitialize: true,
  validationSchema: Yup.object().shape({}),
  handleSubmit: async (values, { props }) => {
    props.onSubmit(values);
  },
})(InnerForm);

const Widget = ({ name, devices }: IProps) => {
  const intl = useIntl();
  const [item, setItem] = useState<IIntranetBond>();
  const [notification, setNotification] = useState<INotificationBarState>();
  const dispatch = useAppDispatch();
  const loadBond = useCallback(async () => {
    const res = await get_intranet_bond(name);
    if (res.data?.intranetBond) {
      setItem(res.data.intranetBond);
    } else if (res.errors) {
      dispatch(show_danger(res.errors));
    }
  }, [name, dispatch]);
  useEffect(() => {
    (async () => {
      await loadBond();
    })();
  }, [loadBond]);
  return (
    <>
      {notification && (
        <NotificationBar
          hidden={async () => {
            setNotification(undefined);
          }}
          state={notification}
        />
      )}
      <IForm
        devices={devices}
        bond={item}
        onSubmit={async (values) => {
          const res = await set_intranet_bond(
            name,
            values.interfaces,
            values.address,
            values.dns,
            values.mode,
            values.enable,
          );
          if (res.data?.intranetBond) {
            setNotification({
              action: "success",
              messages: [intl.formatMessage({ id: "flashes.succeed" })],
            });
          } else if (res.errors) {
            setNotification({
              action: "danger",
              messages: res.errors.map((it) => it.message),
            });
          }
        }}
      />
    </>
  );
};

export default Widget;
