import { protocol, type INatRule } from "../../api/rules";

interface IProps {
  item: INatRule;
}

const Widget = ({ item }: IProps) => {
  return (
    <span>
      {item.__typename} {protocol(item.tcp)}:{item.port}@{item.device}
      {item.destinationIp}:{item.destinationPort}
    </span>
  );
};

export default Widget;
