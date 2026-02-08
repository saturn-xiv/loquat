import { useEffect, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

import Timestamp from "../../components/Timestamp";
import { useAppDispatch } from "../../hooks";
import {
  danger as show_danger,
  success as show_success,
} from "../../reducers/notification";
import {
  disable as disable_member,
  enable as enable_member,
  index as index_member,
  type IMember,
} from "../../api/members";
import NewForm from "./New";
import EditForm from "./Edit";
import SetWifiPassword from "./SetWifiPassword";
import ModalForm from "../../components/ModalForm";
import ConfirmDialog from "../../components/ConfirmDialog";

export const INDEX = "/dashboard/members";

const Widget = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<IMember[]>([]);
  const handleRefresh = async () => {
    const res = await index_member();
    if (res.data?.indexMember) {
      setItems(res.data.indexMember);
    } else if (res.errors) {
      dispatch(show_danger(res.errors));
    }
  };
  const onSelect = useCallback(handleRefresh, [dispatch]);
  useEffect(() => {
    (async () => {
      await onSelect();
    })();
  }, [onSelect]);
  return (
    <>
      <div className="is-size-2">
        <FormattedMessage id="pages.members.index.title" />
      </div>
      <table className="table is-hoverable is-fullwidth">
        <thead>
          <tr>
            <th>
              <FormattedMessage id="tables.column.label.sn" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.name" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.memo" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.updated-at" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.manage" />
            </th>
          </tr>
        </thead>
        <tfoot>
          <tr>
            <td colSpan={5}>
              <div className="buttons are-small">
                <ModalForm
                  title={intl.formatMessage({ id: "pages.members.new.title" })}
                  button={{
                    action: "primary",
                    label: intl.formatMessage({ id: "buttons.new" }),
                  }}
                  handleRefresh={handleRefresh}
                >
                  <NewForm />
                </ModalForm>
              </div>
            </td>
          </tr>
        </tfoot>
        <tbody>
          {items.map((it, id) => (
            <tr key={id}>
              <td>{it.sn}</td>
              <td>{it.name}</td>
              <td>{it.memo}</td>
              <td>
                <Timestamp value={it.updatedAt} />
              </td>
              <td>
                <div className="buttons are-small">
                  {it.deletedAt ? (
                    <>
                      <ConfirmDialog
                        button={{
                          action: "warning",
                          label: intl.formatMessage({ id: "buttons.enable" }),
                        }}
                        title={intl.formatMessage({ id: "are-you-sure" })}
                        onSubmit={async () => {
                          const res = await enable_member(it.id);
                          if (res.data?.enableMember) {
                            dispatch(
                              show_success([
                                intl.formatMessage({ id: "flashes.succeed" }),
                              ])
                            );
                            await handleRefresh();
                          } else if (res.errors) {
                            dispatch(show_danger(res.errors));
                          }
                        }}
                      >
                        <FormattedMessage
                          id="pages.members.index.enable.content"
                          values={{ sn: it.sn }}
                        />
                      </ConfirmDialog>
                    </>
                  ) : (
                    <>
                      <ModalForm
                        title={intl.formatMessage(
                          { id: "pages.members.edit.title" },
                          { sn: it.sn }
                        )}
                        button={{
                          action: "link",
                          label: intl.formatMessage({ id: "buttons.edit" }),
                        }}
                        handleRefresh={handleRefresh}
                      >
                        <EditForm item={it} />
                      </ModalForm>
                      <ModalForm
                        title={intl.formatMessage(
                          { id: "pages.members.set-wifi-password.title" },
                          { sn: it.sn }
                        )}
                        button={{
                          action: "info",
                          label: intl.formatMessage({
                            id: "pages.members.index.set-wifi-password",
                          }),
                        }}
                        handleRefresh={handleRefresh}
                      >
                        <SetWifiPassword item={it} />
                      </ModalForm>

                      <ConfirmDialog
                        button={{
                          action: "danger",
                          label: intl.formatMessage({ id: "buttons.disable" }),
                        }}
                        title={intl.formatMessage({ id: "are-you-sure" })}
                        onSubmit={async () => {
                          const res = await disable_member(it.id);
                          if (res.data?.disableMember) {
                            dispatch(
                              show_success([
                                intl.formatMessage({ id: "flashes.succeed" }),
                              ])
                            );
                            await handleRefresh();
                          } else if (res.errors) {
                            dispatch(show_danger(res.errors));
                          }
                        }}
                      >
                        <FormattedMessage
                          id="pages.members.index.disable.content"
                          values={{ sn: it.sn }}
                        />
                      </ConfirmDialog>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default Widget;
