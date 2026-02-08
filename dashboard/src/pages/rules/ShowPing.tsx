import type { IPingRule } from "../../api/rules";

interface IProps {
  item: IPingRule;
}

const Widget = ({ item }: IProps) => {
  return (
    <span>
      {item.__typename} {item.device}
    </span>
  );
};

export default Widget;
