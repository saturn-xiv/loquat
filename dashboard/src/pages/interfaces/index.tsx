import { useCallback, useEffect, useState } from "react";

import { useAppDispatch } from "../../hooks";
import { DMZ, interfaces, LAN, type IEthernet } from "../../api/interface";
import { danger as show_danger } from "../../reducers/notification";
import ModalForm from "../../components/ModalForm";
import IntranetBondForm, {
  BalanceAlb as IntranetBond6Description,
  BalanceXor as IntranetBond3Description,
} from "./IntranetBond";
import InterfaceForm from "./Interface";

const Widget = () => {
  const dispatch = useAppDispatch();
  const [devices, setDevices] = useState<IEthernet[]>([]);

  const handleRefresh = async () => {
    const res = await interfaces();
    if (res.data?.interfaces) {
      setDevices(res.data.interfaces.ethernets);
    } else if (res.errors) {
      dispatch(show_danger(res.errors));
    }
  };

  const loadDevices = useCallback(handleRefresh, [dispatch]);
  useEffect(() => {
    (async () => {
      await loadDevices();
    })();
  }, [loadDevices]);

  return (
    <div className="grid is-col-min-12">
      <div className="buttons are-small">
        <ModalForm
          title={DMZ}
          button={{
            action: "info",
            label: DMZ,
          }}
          handleRefresh={handleRefresh}
          footer={
            <>
              <IntranetBond3Description />
              <IntranetBond6Description />
            </>
          }
        >
          <IntranetBondForm devices={devices} name={DMZ} />
        </ModalForm>
        <ModalForm
          title={LAN}
          button={{
            action: "info",
            label: LAN,
          }}
          handleRefresh={handleRefresh}
          footer={
            <>
              <IntranetBond3Description />
              <IntranetBond6Description />
            </>
          }
        >
          <IntranetBondForm devices={devices} name={LAN} />
        </ModalForm>
        {devices.map((it, id) => (
          <ModalForm
            key={id}
            title={it.name}
            button={{
              action: "info",
              label: `${it.name}-${it.profile?.label || ""}`,
            }}
            handleRefresh={handleRefresh}
          >
            <InterfaceForm name={it.name} />
          </ModalForm>
        ))}
      </div>
    </div>
  );
};

export default Widget;
