import { FormattedMessage, useIntl } from "react-intl";
import * as Yup from "yup";
import { withFormik, type FormikProps, Form, Field } from "formik";
import { useCallback, useEffect, useState } from "react";

import {
  NotificationBar,
  type INotificationBarState,
} from "../../components/NotificationBar";
import {
  disable_interface,
  get_interface,
  set_interface_dhcp,
  set_interface_static_ip,
  type IDhcp,
  type IStaticIp,
} from "../../api/interface";
import { useAppDispatch } from "../../hooks";
import { danger as show_danger } from "../../reducers/notification";

const ISP_OTHER = "Unknown";

interface IProps {
  name: string;
}

interface IFormValues {
  label: string;
  isp: string;
  address: string;
  netmask: string;
  gateway: string;
  dns1: string;
  dns2: string;
  dhcp: boolean;
  memo: string;
  priority: string;
  enable: boolean;
}

const InnerForm = (
  props: {
    onSubmit: (value: IFormValues) => Promise<void>;
  } & FormikProps<IFormValues>,
) => {
  const { touched, errors, values, isSubmitting } = props;
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

      <div className="field">
        <label className="label">
          <FormattedMessage id="forms.fields.label.name" />
        </label>
        <div className="control">
          <Field className="input" name="label" />
        </div>
        {touched.label && errors.label && (
          <p className="help is-danger">{errors.label}</p>
        )}
      </div>

      {values.enable && (
        <div className="field">
          <div className="control">
            <label className="checkbox">
              <Field type="checkbox" name="dhcp" />
              &nbsp;DHCP
            </label>
          </div>
        </div>
      )}
      {values.enable && !values.dhcp && !values.dhcp && (
        <div className="field">
          <label className="label">
            <FormattedMessage id="forms.fields.label.address" />
          </label>
          <div className="control">
            <Field disabled={values.dhcp} className="input" name="address" />
          </div>
          {touched.address && errors.address && (
            <p className="help is-danger">{errors.address}</p>
          )}
        </div>
      )}
      {values.enable && !values.dhcp && (
        <div className="field">
          <label className="label">
            <FormattedMessage id="forms.fields.label.netmask" />
          </label>
          <div className="control">
            <Field disabled={values.dhcp} className="input" name="netmask" />
          </div>
          {touched.netmask && errors.netmask && (
            <p className="help is-danger">{errors.netmask}</p>
          )}
        </div>
      )}
      {values.enable && !values.dhcp && (
        <div className="field">
          <label className="label">
            <FormattedMessage id="forms.fields.label.gateway" />
          </label>
          <div className="control">
            <Field disabled={values.dhcp} className="input" name="gateway" />
          </div>
          {touched.gateway && errors.gateway && (
            <p className="help is-danger">{errors.gateway}</p>
          )}
        </div>
      )}
      {values.enable && !values.dhcp && (
        <div className="field">
          <label className="label">
            <FormattedMessage id="forms.fields.label.dns1" />
          </label>
          <div className="control">
            <Field disabled={values.dhcp} className="input" name="dns1" />
          </div>
          {touched.dns1 && errors.dns1 && (
            <p className="help is-danger">{errors.dns1}</p>
          )}
        </div>
      )}
      {values.enable && !values.dhcp && (
        <div className="field">
          <label className="label">
            <FormattedMessage id="forms.fields.label.dns2" />
          </label>
          <div className="control">
            <Field disabled={values.dhcp} className="input" name="dns2" />
          </div>
          {touched.dns2 && errors.dns2 && (
            <p className="help is-danger">{errors.dns2}</p>
          )}
        </div>
      )}

      {values.enable && (
        <div className="field">
          <label className="label">
            <FormattedMessage id="forms.fields.label.memo" />
          </label>
          <div className="control">
            <Field className="textarea" component="textarea" name="memo" />
          </div>
          {touched.memo && errors.memo && (
            <p className="help is-danger">{errors.memo}</p>
          )}
        </div>
      )}

      {values.enable && (
        <div className="field">
          <label className="label">
            <FormattedMessage id="forms.fields.label.priority" />
          </label>
          <div className="control">
            <div className="select">
              <Field name="priority" component="select">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((it, id) => (
                  <option key={id} value={it}>
                    {it}
                  </option>
                ))}
              </Field>
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
    profile?: IStaticIp | IDhcp;
    onSubmit: (value: IFormValues) => Promise<void>;
  },
  IFormValues
>({
  mapPropsToValues: (props) => {
    return {
      label: props.profile?.label || "",
      isp: props.profile?.isp || "",
      address:
        props.profile && "netmask" in props.profile
          ? props.profile.address
          : "",
      netmask:
        props.profile && "netmask" in props.profile
          ? props.profile.netmask
          : "",
      gateway:
        props.profile && "netmask" in props.profile
          ? props.profile.gateway
          : "",
      dns1:
        props.profile &&
        "netmask" in props.profile &&
        props.profile.dns.length >= 1
          ? props.profile.dns[0]
          : "",
      dns2:
        props.profile &&
        "netmask" in props.profile &&
        props.profile.dns.length >= 2
          ? props.profile.dns[1]
          : "",
      memo: props.profile?.memo || "",
      enable: props.profile?.enable || false,
      priority: `${props.profile?.priority || 1}`,
      dhcp: !(props.profile && "netmask" in props.profile),
    };
  },
  enableReinitialize: true,
  validationSchema: Yup.object().shape({}),
  handleSubmit: async (values, { props }) => {
    props.onSubmit(values);
  },
})(InnerForm);

const Widget = ({ name }: IProps) => {
  const [item, setItem] = useState<IDhcp | IStaticIp>();
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const [notification, setNotification] = useState<INotificationBarState>();
  const loadInterface = useCallback(async () => {
    const res = await get_interface(name);
    if (res.data?.getNetworkInterface) {
      setItem(res.data.getNetworkInterface);
    } else if (res.errors) {
      dispatch(show_danger(res.errors));
    }
  }, [name, dispatch]);
  useEffect(() => {
    (async () => {
      await loadInterface();
    })();
  }, [loadInterface]);
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
        profile={item}
        onSubmit={async (values) => {
          if (values.enable) {
            if (values.dhcp) {
              const res = await set_interface_dhcp(
                name,
                values.label,
                ISP_OTHER,
                values.memo,
                parseInt(values.priority),
              );
              if (res.data?.setNetworkInterfacePublicDhcp) {
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
            } else {
              const dns = [];
              if (values.dns1 !== "") {
                dns.push(values.dns1);
              }
              if (values.dns2 !== "") {
                dns.push(values.dns2);
              }
              const res = await set_interface_static_ip(
                name,
                values.label,
                ISP_OTHER,
                values.address,
                values.netmask,
                values.gateway,
                dns,
                values.memo,
                parseInt(values.priority),
              );
              if (res.data?.setNetworkInterfacePublicStaticIp) {
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
            }
          } else {
            const res = await disable_interface(name, values.label);
            if (res.data?.disableNetworkInterface) {
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
          }
        }}
      />
    </>
  );
};

export default Widget;
