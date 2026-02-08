import { useEffect } from "react";

import { useAppSelector, useAppDispatch } from "../hooks";
import { refresh } from "../reducers/layout";
import { refresh as refresh_layout } from "../api";
import { currentUser, get as get_token, signIn } from "../reducers/session";

const Widget = () => {
  const layout = useAppSelector((state) => state.layout);
  const user = useAppSelector(currentUser);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (layout.version === undefined) {
      const handle_refresh = async () => {
        const res = await refresh_layout();
        if (res.data) {
          dispatch(refresh(res.data.refresh));
        }
      };
      handle_refresh();
    }
    if (user === undefined) {
      const token = get_token();
      if (token) {
        dispatch(signIn(token));
      }
    }
  }, [layout, user, dispatch]);
  return (
    <div className="content has-text-centered">
      <span>
        <strong>{layout.hostname}</strong> - {layout.description}
      </span>
      <br />
      <span>
        &copy;{new Date().getFullYear()}&nbsp;{layout.version}.
      </span>
      <br />
      <span>
        The source code is licensed &nbsp;
        <a target="_blank" href="https://opensource.org/license/mit">
          MIT
        </a>
        .
      </span>
    </div>
  );
};

export default Widget;
