import dayjs from "dayjs";

interface IProps {
  value: Date;
}

const Widget = ({ value }: IProps) => <>{dayjs(value).format("llll")}</>;

export default Widget;
