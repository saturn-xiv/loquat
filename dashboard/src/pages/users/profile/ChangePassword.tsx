import { FormattedMessage, useIntl } from "react-intl";
import * as Yup from "yup";
import { withFormik, type FormikProps, Form, Field } from "formik";

import {
  danger as show_danger,
  success as show_success,
} from "../../../reducers/notification";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { currentUser } from "../../../reducers/session";
import { updateProfile } from "../../../api/users";

interface IFormValues {
  currentUsername: string;
  currentPassword: string;
  newPassword: string;
  passwordConfirmation: string;
}

const InnerForm = (
  props: {
    title: string;
    onSubmit: (value: IFormValues) => Promise<void>;
  } & FormikProps<IFormValues>
) => {
  const { touched, errors, isSubmitting, title } = props;
  return (
    <Form>
      <div className="is-size-3">{title}</div>
      <div className="field">
        <label className="label">
          <FormattedMessage id="forms.fields.label.current-username" />
        </label>
        <div className="control">
          <Field
            disabled
            className="input"
            type="text"
            name="currentUsername"
          />
        </div>
      </div>

      <div className="field">
        <label className="label">
          <FormattedMessage id="forms.fields.label.current-password" />
        </label>
        <div className="control">
          <Field className="input" type="password" name="currentPassword" />
        </div>
        {touched.currentPassword && errors.currentPassword && (
          <p className="help is-danger">{errors.currentPassword}</p>
        )}
      </div>

      <div className="field">
        <label className="label">
          <FormattedMessage id="forms.fields.label.new-password" />
        </label>
        <div className="control">
          <Field className="input" type="password" name="newPassword" />
        </div>
        {touched.newPassword && errors.newPassword && (
          <p className="help is-danger">{errors.newPassword}</p>
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
    title: string;
    username: string;
    onSubmit: (value: IFormValues) => Promise<void>;
  },
  IFormValues
>({
  mapPropsToValues: (props) => {
    return {
      currentUsername: props.username,
      currentPassword: "",
      newPassword: "",
      passwordConfirmation: "",
    };
  },
  enableReinitialize: true,
  validationSchema: Yup.object().shape({
    newPassword: Yup.string().min(6).max(31).required(),
    passwordConfirmation: Yup.string()
      .oneOf([Yup.ref("newPassword")])
      .required(),
  }),
  handleSubmit: async (values, { props, resetForm }) => {
    props.onSubmit(values);
    resetForm();
  },
})(InnerForm);

const Widget = () => {
  const intl = useIntl();
  const user = useAppSelector(currentUser);
  const dispatch = useAppDispatch();
  return (
    <IForm
      title={intl.formatMessage({ id: "pages.users.change-password.title" })}
      username={user || ""}
      onSubmit={async (values) => {
        const res = await updateProfile(
          {
            name: values.currentUsername,
            password: values.currentPassword,
          },
          { name: values.currentUsername, password: values.newPassword }
        );
        if (res.data?.updateProfile) {
          dispatch(
            show_success([intl.formatMessage({ id: "flashes.succeed" })])
          );
        } else if (res.errors) {
          dispatch(show_danger(res.errors));
        }
      }}
    />
  );
};

export default Widget;
