import { useCallback, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useCopyToClipboard } from "usehooks-ts";

import SetOwnerForm from "./SetOwner";
import SetIpAddressForm from "./SetIpAddress";
import { useAppDispatch } from "../../hooks";
import {
  block as block_host,
  release as release_host,
  index as index_host,
  type IHost,
} from "../../api/hosts";
import {
  danger as show_danger,
  success as show_success,
} from "../../reducers/notification";
import ModalForm from "../../components/ModalForm";
import ConfirmDialog from "../../components/ConfirmDialog";
import Timestamp from "../../components/Timestamp";

const Widget = () => {
  const intl = useIntl();
  const [, copy] = useCopyToClipboard();
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<IHost[]>([]);
  const handleRefresh = async () => {
    const res = await index_host();
    if (res.data?.indexHost) {
      setItems(res.data.indexHost);
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
        <FormattedMessage id="pages.hosts.index.title" />
      </div>
      <table className="table is-hoverable is-fullwidth">
        <thead>
          <tr>
            <th>
              <FormattedMessage id="tables.column.label.mac" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.ip" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.name" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.vendor" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.network" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.owner" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.updated-at" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.manage" />
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, id) => (
            <tr key={id}>
              <td>
                <span onClick={() => copy(it.mac)} className="tag">
                  {it.mac}
                </span>
              </td>
              <td>
                {it.fixed ? (
                  <button
                    onClick={() => copy(it.ip)}
                    className="button is-small is-primary is-dark"
                  >
                    {it.ip}
                  </button>
                ) : (
                  <button
                    onClick={() => copy(it.ip)}
                    className="button is-small is-text"
                  >
                    {it.ip}
                  </button>
                )}
              </td>
              <td>{it.name}</td>
              <td>{it.vendor}</td>
              <td>{it.network}</td>
              <td>
                {it.member ? (
                  <span>
                    {it.member.name}({it.member.sn})
                  </span>
                ) : (
                  <>n/a</>
                )}
              </td>
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
                          label: intl.formatMessage({ id: "buttons.release" }),
                        }}
                        title={intl.formatMessage({ id: "are-you-sure" })}
                        onSubmit={async () => {
                          const res = await release_host(it.id);
                          if (res.data?.releaseHost) {
                            dispatch(
                              show_success([
                                intl.formatMessage({ id: "flashes.succeed" }),
                              ]),
                            );
                            await handleRefresh();
                          } else if (res.errors) {
                            dispatch(show_danger(res.errors));
                          }
                        }}
                      >
                        <FormattedMessage
                          id="pages.hosts.index.release.content"
                          values={{ ip: it.ip }}
                        />
                      </ConfirmDialog>
                    </>
                  ) : (
                    <>
                      <ModalForm
                        title={intl.formatMessage(
                          { id: "pages.hosts.set-ip-address.title" },
                          { ip: it.ip },
                        )}
                        button={{
                          action: "link",
                          label: intl.formatMessage({
                            id: "pages.hosts.index.set-ip-address",
                          }),
                        }}
                        handleRefresh={handleRefresh}
                      >
                        <SetIpAddressForm item={it} />
                      </ModalForm>
                      <ModalForm
                        title={intl.formatMessage(
                          { id: "pages.hosts.set-owner.title" },
                          { ip: it.ip },
                        )}
                        button={{
                          action: "info",
                          label: intl.formatMessage({
                            id: "pages.hosts.index.set-owner",
                          }),
                        }}
                        handleRefresh={handleRefresh}
                      >
                        <SetOwnerForm item={it} />
                      </ModalForm>

                      <ConfirmDialog
                        button={{
                          action: "danger",
                          label: intl.formatMessage({ id: "buttons.block" }),
                        }}
                        title={intl.formatMessage({ id: "are-you-sure" })}
                        onSubmit={async () => {
                          const res = await block_host(it.id);
                          if (res.data?.blockHost) {
                            dispatch(
                              show_success([
                                intl.formatMessage({ id: "flashes.succeed" }),
                              ]),
                            );
                            await handleRefresh();
                          } else if (res.errors) {
                            dispatch(show_danger(res.errors));
                          }
                        }}
                      >
                        <FormattedMessage
                          id="pages.hosts.index.block.content"
                          values={{ ip: it.ip }}
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
