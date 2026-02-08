import { useCallback, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import * as Yup from "yup";
import { withFormik, type FormikProps, Form, Field } from "formik";

import {
  NotificationBar,
  type INotificationBarState,
} from "../../components/NotificationBar";
import {
  addresses as fetch_addresses,
  set_dynamic_ip,
  set_static_ip,
  type IHost,
} from "../../api/hosts";

interface IProps {
  item: IHost;
}

interface IFormValues {
  name: string;
  ip: string;
  dhcp: boolean;
}

const InnerForm = (
  props: {
    onSubmit: (value: IFormValues) => Promise<void>;
    addresses: string[];
  } & FormikProps<IFormValues>
) => {
  const { touched, errors, addresses, isSubmitting, values } = props;
  return (
    <Form>
      <div className="field">
        <label className="label">
          <FormattedMessage id="forms.fields.label.name" />
        </label>
        <div className="control">
          <Field className="input" name="name" />
        </div>
        {touched.name && errors.name && (
          <p className="help is-danger">{errors.name}</p>
        )}
      </div>
      {values.dhcp || (
        <div className="field">
          <label className="label">
            <FormattedMessage id="forms.fields.label.ip" />
          </label>
          <div className="control">
            <div className="select">
              <Field name="ip" component="select">
                {addresses.map((it, id) => (
                  <option key={id} value={it}>
                    {it}
                  </option>
                ))}
              </Field>
            </div>
          </div>
          {touched.ip && errors.ip && (
            <p className="help is-danger">{errors.ip}</p>
          )}
        </div>
      )}

      <div className="field">
        <div className="control">
          <label className="checkbox">
            <Field type="checkbox" name="dhcp" />
            &nbsp;DHCP
          </label>
        </div>
      </div>

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
    host: IHost;
    addresses: string[];
    onSubmit: (value: IFormValues) => Promise<void>;
  },
  IFormValues
>({
  mapPropsToValues: (props) => {
    return {
      name: props.host.name,
      ip: props.host.ip,
      dhcp: !props.host.fixed,
    };
  },
  enableReinitialize: true,
  validationSchema: Yup.object().shape({
    name: Yup.string().min(2).max(31).required(),
    ip: Yup.string().required(),
  }),
  handleSubmit: async (values, { props }) => {
    props.onSubmit(values);
  },
})(InnerForm);

const Widget = ({ item }: IProps) => {
  const intl = useIntl();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [notification, setNotification] = useState<INotificationBarState>();

  const loadAddresses = useCallback(async () => {
    const res = await fetch_addresses(item.network);
    if (res.data?.addresses) {
      setAddresses(res.data.addresses);
    } else if (res.errors) {
      setNotification({
        action: "danger",
        messages: res.errors.map((it) => it.message),
      });
    }
  }, [item]);
  useEffect(() => {
    (async () => {
      await loadAddresses();
    })();
  }, [loadAddresses]);
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
        addresses={addresses}
        host={item}
        onSubmit={async (values) => {
          if (values.dhcp) {
            const res = await set_dynamic_ip(item.id, values.name);
            if (res.data?.setHostDynamicIp) {
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
            const res = await set_static_ip(item.id, values.name, values.ip);
            if (res.data?.setHostStaticIp) {
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
