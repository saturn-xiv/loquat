import {
  INPUT_RULE,
  NAT_RULE,
  PING_RULE,
  type IInputRule,
  type INatRule,
  type IPingRule,
  type IRule,
} from "../../api/rules";
import NatForm from "./NatForm";
import InputForm from "./InputForm";
import PingForm from "./PingForm";
import type { IEthernet } from "../../api/interface";

interface IProps {
  item: IRule;
  devices: IEthernet[];
}

const Widget = ({ item, devices }: IProps) => {
  if (item.__typename === NAT_RULE) {
    return <NatForm devices={devices} item={item as INatRule} />;
  }
  if (item.__typename === PING_RULE) {
    return <PingForm devices={devices} item={item as IPingRule} />;
  }
  if (item.__typename === INPUT_RULE) {
    return <InputForm devices={devices} item={item as IInputRule} />;
  }
  return <></>;
};

export default Widget;
