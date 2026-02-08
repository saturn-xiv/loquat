import { FormattedMessage, useIntl } from "react-intl";
import * as Yup from "yup";
import { withFormik, type FormikProps, Form, Field } from "formik";
import { useState } from "react";

import { update as update_member, type IMember } from "../../api/members";
import {
  NotificationBar,
  type INotificationBarState,
} from "../../components/NotificationBar";

interface IProps {
  item: IMember;
}

interface IFormValues {
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
    member: IMember;
    onSubmit: (value: IFormValues) => Promise<void>;
  },
  IFormValues
>({
  mapPropsToValues: (props) => {
    return {
      name: props.member.name,
      memo: props.member.memo,
    };
  },
  enableReinitialize: true,
  validationSchema: Yup.object().shape({
    name: Yup.string().min(2).max(63).required(),
    memo: Yup.string().min(1).max(2047).required(),
  }),
  handleSubmit: async (values, { props }) => {
    props.onSubmit(values);
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
        member={item}
        onSubmit={async (values) => {
          const res = await update_member(item.id, values.name, values.memo);
          if (res.data?.updateMember) {
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
