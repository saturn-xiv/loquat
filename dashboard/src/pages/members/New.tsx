import { FormattedMessage, useIntl } from "react-intl";
import * as Yup from "yup";
import { withFormik, type FormikProps, Form, Field } from "formik";
import { useState } from "react";

import { create as create_member } from "../../api/members";
import {
  NotificationBar,
  type INotificationBarState,
} from "../../components/NotificationBar";

interface IFormValues {
  sn: string;
  name: string;
  memo: string;
}

const InnerForm = (
  props: {
    onSubmit: (value: IFormValues) => Promise<void>;
  } & FormikProps<IFormValues>
) => {
  const { touched, errors, isSubmitting } = props;
  return (
    <>
      <Form>
        <div className="field">
          <label className="label">
            <FormattedMessage id="forms.fields.label.sn" />
          </label>
          <div className="control">
            <Field className="input" name="sn" />
          </div>
          {touched.sn && errors.sn && (
            <p className="help is-danger">{errors.sn}</p>
          )}
        </div>
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
    </>
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
      sn: "",
      name: "",
      memo: "",
    };
  },
  enableReinitialize: true,
  validationSchema: Yup.object().shape({
    sn: Yup.string().min(1).max(31).required(),
    name: Yup.string().min(2).max(63).required(),
    memo: Yup.string().min(1).max(2047).required(),
  }),
  handleSubmit: async (values, { props, resetForm }) => {
    await props.onSubmit(values);
    resetForm();
  },
})(InnerForm);

const Widget = () => {
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
          const res = await create_member(values.sn, values.name, values.memo);
          if (res.data?.createMember) {
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
