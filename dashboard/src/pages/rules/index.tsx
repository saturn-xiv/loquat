import { useCallback, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

import ShowRule from "./Show";
import { useAppDispatch } from "../../hooks";
import {
  danger as show_danger,
  success as show_success,
} from "../../reducers/notification";
import ModalForm from "../../components/ModalForm";
import ConfirmDialog from "../../components/ConfirmDialog";
import Timestamp from "../../components/Timestamp";
import {
  disable as disable_rule,
  enable as enable_rule,
  index as index_rule,
  type IRule,
} from "../../api/rules";
import NatForm from "./NatForm";
import InputForm from "./InputForm";
import PingForm from "./PingForm";
import Edit from "./Edit";
import { interfaces, type IEthernet } from "../../api/interface";

const Widget = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<IRule[]>([]);
  const [devices, setDevices] = useState<IEthernet[]>([]);
  const handleRefresh = async () => {
    {
      const res = await interfaces();
      if (res.data?.interfaces) {
        setDevices(res.data.interfaces.ethernets);
      } else if (res.errors) {
        dispatch(show_danger(res.errors));
      }
    }
    {
      const res = await index_rule();
      if (res.data?.indexFirewallRule) {
        setItems(res.data.indexFirewallRule);
      } else if (res.errors) {
        dispatch(show_danger(res.errors));
      }
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
        <FormattedMessage id="pages.rules.index.title" />
      </div>
      <table className="table is-hoverable is-fullwidth">
        <thead>
          <tr>
            <th>
              <FormattedMessage id="tables.column.label.sort-order" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.details" />
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
                  title={intl.formatMessage({
                    id: "pages.rules.index.new-ping",
                  })}
                  button={{
                    action: "primary",
                    label: intl.formatMessage({
                      id: "pages.rules.index.new-ping",
                    }),
                  }}
                  handleRefresh={handleRefresh}
                >
                  <PingForm devices={devices} />
                </ModalForm>
                <ModalForm
                  title={intl.formatMessage({
                    id: "pages.rules.index.new-input",
                  })}
                  button={{
                    action: "primary",
                    label: intl.formatMessage({
                      id: "pages.rules.index.new-input",
                    }),
                  }}
                  handleRefresh={handleRefresh}
                >
                  <InputForm devices={devices} />
                </ModalForm>
                <ModalForm
                  title={intl.formatMessage({
                    id: "pages.rules.index.new-nat",
                  })}
                  button={{
                    action: "primary",
                    label: intl.formatMessage({
                      id: "pages.rules.index.new-nat",
                    }),
                  }}
                  handleRefresh={handleRefresh}
                >
                  <NatForm devices={devices} />
                </ModalForm>
              </div>
            </td>
          </tr>
        </tfoot>
        <tbody>
          {items.map((it, id) => (
            <tr key={id}>
              <td>{it.sortOrder}</td>
              <td>
                <ShowRule item={it} />
              </td>
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
                          action: "danger",
                          label: intl.formatMessage({ id: "buttons.enable" }),
                        }}
                        title={intl.formatMessage({ id: "are-you-sure" })}
                        onSubmit={async () => {
                          const res = await enable_rule(it.id);
                          if (res.data?.enableFirewallRule) {
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
                          id="pages.rules.index.enable.content"
                          values={{ id: it.id }}
                        />
                      </ConfirmDialog>
                    </>
                  ) : (
                    <>
                      <ModalForm
                        title={intl.formatMessage(
                          {
                            id: "pages.rules.edit.title",
                          },
                          { id: it.id }
                        )}
                        button={{
                          action: "info",
                          label: intl.formatMessage({
                            id: "buttons.edit",
                          }),
                        }}
                        handleRefresh={handleRefresh}
                      >
                        <Edit item={it} devices={devices} />
                      </ModalForm>
                      <ConfirmDialog
                        button={{
                          action: "danger",
                          label: intl.formatMessage({ id: "buttons.disable" }),
                        }}
                        title={intl.formatMessage({ id: "are-you-sure" })}
                        onSubmit={async () => {
                          const res = await disable_rule(it.id);
                          if (res.data?.disableFirewallRule) {
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
                          id="pages.rules.index.disable.content"
                          values={{ id: it.id }}
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
