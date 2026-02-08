import { useTimeout } from "usehooks-ts";

import { useAppSelector, useAppDispatch } from "../hooks";
import { selectNotification, close } from "../reducers/notification";
import Timestamp from "../components/Timestamp";

export interface INotificationBarState {
  action: string;
  messages: string[];
}
interface INotificationBarProps {
  hidden: () => Promise<void>;
  state: INotificationBarState;
}

export const NotificationBar = ({ state, hidden }: INotificationBarProps) => {
  useTimeout(hidden, 8000);
  return (
    <article className={`message is-${state.action}`}>
      <div className="message-header">
        <p>
          <Timestamp value={new Date()} />
        </p>
        <button className="delete" aria-label="delete" onClick={hidden} />
      </div>
      <div className="message-body">
        {state.messages.map((it, id) => (
          <div key={id}>{it}</div>
        ))}
      </div>
    </article>
  );
};

const Widget = () => {
  const { action, messages } = useAppSelector(selectNotification);
  const dispatch = useAppDispatch();
  return action ? (
    <NotificationBar
      state={{ action, messages }}
      hidden={async () => {
        dispatch(close());
      }}
    />
  ) : (
    <></>
  );
};

export default Widget;
