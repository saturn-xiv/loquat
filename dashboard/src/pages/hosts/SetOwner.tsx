import { useCallback, useEffect, useState } from "react";
import * as Yup from "yup";
import { withFormik, type FormikProps, Form, Field } from "formik";
import { FormattedMessage, useIntl } from "react-intl";

import { associate_with_member, type IHost } from "../../api/hosts";
import { index as index_member, type IMember } from "../../api/members";
import {
  NotificationBar,
  type INotificationBarState,
} from "../../components/NotificationBar";

interface IProps {
  item: IHost;
}

interface IFormValues {
  host: string;
  member: string;
}

const InnerForm = (
  props: {
    onSubmit: (value: IFormValues) => Promise<void>;
    members: IMember[];
  } & FormikProps<IFormValues>
) => {
  const { touched, errors, members, isSubmitting } = props;
  return (
    <Form>
      <div className="field">
        <label className="label">
          <FormattedMessage id="forms.fields.label.host" />
        </label>
        <div className="control">
          <Field disabled className="input" name="host" />
        </div>
        {touched.host && errors.host && (
          <p className="help is-danger">{errors.host}</p>
        )}
      </div>
      <div className="field">
        <label className="label">
          <FormattedMessage id="forms.fields.label.owner" />
        </label>
        <div className="control">
          <div className="select">
            <Field name="member" component="select">
              {members.map((it, id) => (
                <option key={id} value={it.id}>
                  {it.name}({it.sn})
                </option>
              ))}
            </Field>
          </div>
        </div>
        {touched.member && errors.member && (
          <p className="help is-danger">{errors.member}</p>
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
    host: IHost;
    members: IMember[];
    onSubmit: (value: IFormValues) => Promise<void>;
  },
  IFormValues
>({
  mapPropsToValues: (props) => {
    return {
      host: `${props.host.ip}(${props.host.mac})`,
      member: props.host.member?.id || props.members[0]?.id || "",
    };
  },
  enableReinitialize: true,
  validationSchema: Yup.object().shape({
    host: Yup.string().required(),
    member: Yup.string().required(),
  }),
  handleSubmit: async (values, { props }) => {
    props.onSubmit(values);
  },
})(InnerForm);

const Widget = ({ item }: IProps) => {
  const intl = useIntl();
  const [members, setMembers] = useState<IMember[]>([]);
  const [notification, setNotification] = useState<INotificationBarState>();

  const loadMembers = useCallback(async () => {
    const res = await index_member();
    if (res.data?.indexMember) {
      setMembers(res.data.indexMember);
    } else if (res.errors) {
      setNotification({
        action: "danger",
        messages: res.errors.map((it) => it.message),
      });
    }
  }, []);
  useEffect(() => {
    (async () => {
      await loadMembers();
    })();
  }, [loadMembers]);
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
        members={members}
        host={item}
        onSubmit={async (values) => {
          const res = await associate_with_member(item.id, values.member);
          if (res.data?.associateHostWithMember) {
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
