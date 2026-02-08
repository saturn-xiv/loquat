import {
  INPUT_RULE,
  NAT_RULE,
  PING_RULE,
  type IInputRule,
  type INatRule,
  type IPingRule,
  type IRule,
} from "../../api/rules";
import ShowNat from "./ShowNat";
import ShowInput from "./ShowInput";
import ShowPing from "./ShowPing";

interface IProps {
  item: IRule;
}

const Widget = ({ item }: IProps) => {
  if (item.__typename === NAT_RULE) {
    return <ShowNat item={item as INatRule} />;
  }
  if (item.__typename === PING_RULE) {
    return <ShowPing item={item as IPingRule} />;
  }
  if (item.__typename === INPUT_RULE) {
    return <ShowInput item={item as IInputRule} />;
  }
  return <></>;
};

export default Widget;
