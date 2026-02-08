import { FormattedMessage } from "react-intl";
import { Outlet, NavLink } from "react-router";

import { SIGN_IN as USERS_SIGN_IN } from "../reducers/session";

const Widget = () => {
  return (
    <div className="fixed-grid">
      <div className="grid">
        <div className="cell">
          <NavLink to={USERS_SIGN_IN}>
            <FormattedMessage id="pages.users.sign-in.title" />
          </NavLink>
        </div>
        <div className="cell">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Widget;
