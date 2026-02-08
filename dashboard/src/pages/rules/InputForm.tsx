import { FormattedMessage, useIntl } from "react-intl";
import * as Yup from "yup";
import { withFormik, type FormikProps, Form, Field } from "formik";
import { useState } from "react";

import {
  NotificationBar,
  type INotificationBarState,
} from "../../components/NotificationBar";
import {
  allow_input,
  protocol,
  TCP,
  UDP,
  type IInputRule,
} from "../../api/rules";
import type { IEthernet } from "../../api/interface";

const SORT_ORDER_SINCE = 2000;

const sort_orders = (): number[] => {
  return [...Array(100).keys()].map((i) => i + SORT_ORDER_SINCE);
};

interface IProps {
  devices: IEthernet[];
  item?: IInputRule;
}

interface IFormValues {
  device: string;
  protocol: string;
  port: number;
  sortOrder: string;
  memo: string;
}

const InnerForm = (
  props: {
    devices: IEthernet[];
    onSubmit: (value: IFormValues) => Promise<void>;
  } & FormikProps<IFormValues>
) => {
  const { touched, devices, errors, isSubmitting } = props;
  return (
    <Form>
      <div className="field">
        <label className="label">
          <FormattedMessage id="forms.fields.label.device" />
        </label>
        <div className="control">
          <div className="select">
            <Field name="device" component="select">
              {devices.map((it, id) => (
                <option key={id} value={it.name}>
                  {it.name}-{it.profile?.label}
                </option>
              ))}
            </Field>
          </div>
        </div>
      </div>

      <div className="field">
        <div className="control">
          <div className="radios">
            {[TCP, UDP].map((it, id) => (
              <label className="radio" key={id}>
                <Field type="radio" name="protocol" value={it} />
                {it}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="field">
        <label className="label">
          <FormattedMessage id="forms.fields.label.port" />
        </label>
        <div className="control">
          <Field className="input" type="number" name="port" />
        </div>
        {touched.port && errors.port && (
          <p className="help is-danger">{errors.port}</p>
        )}
      </div>

      <div className="field">
        <label className="label">
          <FormattedMessage id="forms.fields.label.sort-order" />
        </label>
        <div className="control">
          <div className="select">
            <Field name="sortOrder" component="select">
              {sort_orders().map((it, id) => (
                <option key={id} value={it}>
                  {it}
                </option>
              ))}
            </Field>
          </div>
        </div>
      </div>
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
    rule?: IInputRule;
    devices: IEthernet[];
    onSubmit: (value: IFormValues) => Promise<void>;
  },
  IFormValues
>({
  mapPropsToValues: (props) => {
    return {
      protocol: protocol(props.rule?.tcp),
      port: props.rule?.port || 80,
      device: props.rule?.device || "",
      sortOrder: `${props.rule?.sortOrder || SORT_ORDER_SINCE}`,
      memo: props.rule?.memo || "",
    };
  },
  enableReinitialize: true,
  validationSchema: Yup.object().shape({
    memo: Yup.string().min(1).max(2047).required(),
  }),
  handleSubmit: async (values, { props }) => {
    props.onSubmit(values);
  },
})(InnerForm);

const Widget = ({ item, devices }: IProps) => {
  const intl = useIntl();
  const [notification, setNotification] = useState<INotificationBarState>();
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
        rule={item}
        devices={devices}
        onSubmit={async (values) => {
          const res = await allow_input(
            item?.id,
            values.device,
            values.protocol === TCP,
            values.port,
            parseInt(values.sortOrder),
            values.memo
          );
          if (res.data?.allowInput) {
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
