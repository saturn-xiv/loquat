import { useEffect, useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";

import { type ILog, index_log } from "../../api/users";
import PaginationBar, {
  DEFAULT_PAGE_INDEX,
  DEFAULT_PAGE_SIZE,
} from "../../components/PaginationBar";
import Timestamp from "../../components/Timestamp";
import type { IPage, IPagination } from "../../api";
import { useAppDispatch } from "../../hooks";
import { danger as show_danger } from "../../reducers/notification";

const Widget = () => {
  const dispatch = useAppDispatch();
  const [item, setItem] = useState<{ items: ILog[]; pagination: IPagination }>({
    items: [],
    pagination: {
      total: 0,
      index: DEFAULT_PAGE_INDEX,
      size: DEFAULT_PAGE_SIZE,
      hasNext: false,
      hasPrevious: false,
    } as IPagination,
  });
  const onSelect = useCallback(
    async (page: IPage) => {
      const res = await index_log(page);
      if (res.data?.indexLog) {
        setItem(res.data.indexLog);
      } else if (res.errors) {
        dispatch(show_danger(res.errors));
      }
    },
    [dispatch]
  );
  useEffect(() => {
    (async () => {
      await onSelect({ index: DEFAULT_PAGE_INDEX, size: DEFAULT_PAGE_SIZE });
    })();
  }, [onSelect]);
  return (
    <>
      <div className="is-size-2">
        <FormattedMessage id="pages.users.logs.title" />
      </div>
      <table className="table is-hoverable is-fullwidth">
        <thead>
          <tr>
            <th>
              <FormattedMessage id="tables.column.label.created-at" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.username" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.ip" />
            </th>
            <th>
              <FormattedMessage id="tables.column.label.message" />
            </th>
          </tr>
        </thead>
        <tfoot>
          <tr>
            <th colSpan={4}>
              <PaginationBar
                pagination={item.pagination}
                handleSelect={onSelect}
              />
            </th>
          </tr>
        </tfoot>
        <tbody>
          {item.items.map((it, id) => (
            <tr key={id}>
              <td>
                <Timestamp value={it.createdAt} />
              </td>
              <td>{it.user.name}</td>
              <td>{it.ip}</td>
              <td>{it.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default Widget;
