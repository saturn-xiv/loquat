import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import * as Yup from "yup";
import { withFormik, type FormikProps, Form, Field } from "formik";

import { LOGS, signIn } from "../../reducers/session";
import {
  danger as show_danger,
  success as show_success,
} from "../../reducers/notification";
import { sign_in, type IAccount } from "../../api/users";
import { useAppDispatch } from "../../hooks";

const InnerForm = (
  props: {
    title: string;
    onSubmit: (value: IAccount) => Promise<void>;
  } & FormikProps<IAccount>
) => {
  const { touched, errors, isSubmitting, title } = props;
  return (
    <Form>
      <div className="is-size-2">{title}</div>
      <div className="field">
        <label className="label">
          <FormattedMessage id="forms.fields.label.username" />
        </label>
        <div className="control">
          <Field className="input" type="text" name="name" />
        </div>
        {touched.name && errors.name && (
          <p className="help is-danger">{errors.name}</p>
        )}
      </div>

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
  { title: string; onSubmit: (value: IAccount) => Promise<void> },
  IAccount
>({
  mapPropsToValues: () => {
    return {
      name: "",
      password: "",
    };
  },
  validationSchema: Yup.object().shape({
    name: Yup.string().min(2).max(31).required(),
    password: Yup.string().min(6).max(31).required(),
  }),
  handleSubmit: async (values, { props, resetForm }) => {
    props.onSubmit(values);
    resetForm();
  },
})(InnerForm);

const Widget = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  return (
    <IForm
      title={intl.formatMessage({ id: "pages.users.sign-in.title" })}
      onSubmit={async (values) => {
        const res = await sign_in(values);
        if (res.data?.signIn) {
          dispatch(signIn(res.data.signIn.token));
          navigate(LOGS);
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
