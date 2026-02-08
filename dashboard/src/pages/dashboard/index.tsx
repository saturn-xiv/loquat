import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";

import { status as get_status, type IStatusResponse } from "../../api/router";
import { useAppDispatch } from "../../hooks";
import { danger as show_danger } from "../../reducers/notification";
import ShowNetworkInterface from "./NetworkInterface";
import Status from "./Status";

const Widget = () => {
  const dispatch = useAppDispatch();
  const [item, setItem] = useState<IStatusResponse>();
  useEffect(() => {
    (async () => {
      const res = await get_status();
      if (res.data?.indexNetworkInterface) {
        setItem(res.data);
      } else if (res.errors) {
        dispatch(show_danger(res.errors));
      }
    })();
  }, [dispatch]);

  return (
    <>
      <div className="is-size-3">
        <FormattedMessage id="pages.dashboard.home.interfaces" />
      </div>
      <div className="grid is-col-min-12">
        {item?.indexNetworkInterface.map((it, id) => (
          <ShowNetworkInterface key={id} item={it} />
        ))}
      </div>
      <div className="is-size-3">
        <FormattedMessage id="pages.dashboard.home.system-status" />
      </div>
      <div className="grid is-col-min-24">
        <Status title="cpu" content={item?.status.cpu || ""} />
        <Status title="memory" content={item?.status.memory || ""} />
        <Status title="disk-space" content={item?.status.diskSpace || ""} />
        <Status
          title="disk-index-nodes"
          content={item?.status.diskIndexNodes || ""}
        />
        <Status title="network" content={item?.status.network || ""} />
        <Status title="top" content={item?.status.top || ""} />
        <Status title="sar" content={item?.status.sar || ""} />
        <Status title="hardware" content={item?.status.hardware || ""} />
        <Status title="arp" content={item?.status.arp || ""} />
        <Status title="routes" content={item?.status.routes || ""} />
        <Status title="addresses" content={item?.status.addresses || ""} />
        <Status title="tcp" content={item?.status.tcp || ""} />
        <Status title="udp" content={item?.status.udp || ""} />
        <Status
          title="queueing-discipline"
          content={item?.status.queueingDiscipline || ""}
        />
        <Status title="firewall" content={item?.status.firewall || ""} />
      </div>
    </>
  );
};

export default Widget;
