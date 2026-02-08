import { FormattedMessage, useIntl } from "react-intl";
import * as Yup from "yup";
import { withFormik, type FormikProps, Form, Field } from "formik";

import { set_wifi_password, type IMember } from "../../api/members";
import {
  NotificationBar,
  type INotificationBarState,
} from "../../components/NotificationBar";
import { useState } from "react";

interface IProps {
  item: IMember;
}

interface IFormValues {
  password: string;
  passwordConfirmation: string;
}

const InnerForm = (
  props: {
    onSubmit: (value: IFormValues) => Promise<void>;
  } & FormikProps<IFormValues>
) => {
  const { touched, errors, isSubmitting } = props;
  return (
    <Form>
      <div className="field">
        <label className="label">
          <FormattedMessage id="forms.fields.label.password" />
        </label>
        <div className="control">
          <Field className="input" type="password" name="password" />
        </div>
        {touched.password && errors.password && (
          <p className="help is-danger">{errors.password}</p>
        )}
      </div>
      <div className="field">
        <label className="label">
          <FormattedMessage id="forms.fields.label.password-confirmation" />
        </label>
        <div className="control">
          <Field
            className="input"
            type="password"
            name="passwordConfirmation"
          />
        </div>
        {touched.passwordConfirmation && errors.passwordConfirmation && (
          <p className="help is-danger">{errors.passwordConfirmation}</p>
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
    onSubmit: (value: IFormValues) => Promise<void>;
  },
  IFormValues
>({
  mapPropsToValues: () => {
    return {
      password: "",
      passwordConfirmation: "",
    };
  },
  enableReinitialize: true,
  validationSchema: Yup.object().shape({
    password: Yup.string().min(8).max(31).required(),
    passwordConfirmation: Yup.string()
      .oneOf([Yup.ref("password")])
      .required(),
  }),
  handleSubmit: async (values, { props, resetForm }) => {
    props.onSubmit(values);
    resetForm();
  },
})(InnerForm);

const Widget = ({ item }: IProps) => {
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
        onSubmit={async (values) => {
          const res = await set_wifi_password(item.id, values.password);
          if (res.data?.setMemberWifiPassword) {
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
