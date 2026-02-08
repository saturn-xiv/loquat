import { Link, Outlet, useNavigate } from "react-router";
import { FormattedMessage, useIntl } from "react-intl";

import {
  SIGN_IN as USER_SIGN_IN,
  LOGS as USER_LOGS,
  signOut,
} from "../reducers/session";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  success as show_success,
  danger as show_danger,
} from "../reducers/notification";
import Timestamp from "../components/Timestamp";
import { sign_out } from "../api/users";
import { apply, reboot } from "../api/router";
import ConfirmDialog from "../components/ConfirmDialog";

import logo_svg from "../assets/router.svg";

const NavBar = () => {
  const layout = useAppSelector((state) => state.layout);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const intl = useIntl();
  const handleSignOut = async () => {
    const res = await sign_out();
    if (res.data?.signOut) {
      dispatch(show_success([intl.formatMessage({ id: "flashes.succeed" })]));
    } else if (res.errors) {
      dispatch(show_danger(res.errors));
    }
    dispatch(signOut());
    navigate(USER_SIGN_IN);
  };
  const handleApply = async () => {
    const res = await apply(true);
    if (res.data?.apply) {
      dispatch(show_success([intl.formatMessage({ id: "flashes.succeed" })]));
    } else if (res.errors) {
      dispatch(show_danger(res.errors));
    }
  };
  const handleReboot = async () => {
    const res = await reboot();
    if (res.data?.reboot) {
      navigate(USER_SIGN_IN);
      dispatch(show_success([intl.formatMessage({ id: "flashes.succeed" })]));
    } else if (res.errors) {
      dispatch(show_danger(res.errors));
    }
  };
  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <a className="navbar-item">
          <img src={logo_svg} />
        </a>

        <a
          role="button"
          className="navbar-burger"
          aria-label="menu"
          aria-expanded="false"
          data-target="navbarDashboardLayout"
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div id="navbarDashboardLayout" className="navbar-menu">
        <div className="navbar-start">
          <Link className="navbar-item" to="/dashboard">
            <FormattedMessage id="layouts.dashboard.nav-bar.home" />
          </Link>
          <Link className="navbar-item" to="/dashboard/interfaces">
            <FormattedMessage id="pages.interfaces.index.title" />
          </Link>
          <Link className="navbar-item" to="/dashboard/hosts">
            <FormattedMessage id="pages.hosts.index.title" />
          </Link>
          <Link className="navbar-item" to="/dashboard/members">
            <FormattedMessage id="pages.members.index.title" />
          </Link>
          <Link className="navbar-item" to="/dashboard/rules">
            <FormattedMessage id="pages.rules.index.title" />
          </Link>

          <div className="navbar-item has-dropdown is-hoverable">
            <a className="navbar-link">
              <FormattedMessage id="layouts.dashboard.nav-bar.account" />
            </a>

            <div className="navbar-dropdown">
              <Link className="navbar-item" to={USER_LOGS}>
                <FormattedMessage id="pages.users.logs.title" />
              </Link>
              <Link className="navbar-item" to="/dashboard/account/profile">
                <FormattedMessage id="pages.users.profile.title" />
              </Link>
              <hr className="navbar-divider" />
              <a className="navbar-item" onClick={handleSignOut}>
                <FormattedMessage id="layouts.dashboard.nav-bar.sign-out" />
              </a>
            </div>
          </div>
        </div>

        <div className="navbar-end">
          <div className="navbar-item">
            <FormattedMessage id="layouts.dashboard.nav-bar.last-run-at" />
            :&nbsp;
            {layout.lastRunAt ? (
              <Timestamp value={layout.lastRunAt} />
            ) : (
              <>n/a</>
            )}
          </div>
          <div className="navbar-item">
            <div className="buttons are-small">
              <ConfirmDialog
                button={{
                  action: "info",
                  label: intl.formatMessage({
                    id: "layouts.dashboard.nav-bar.apply",
                  }),
                }}
                title={intl.formatMessage({ id: "are-you-sure" })}
                onSubmit={handleApply}
              >
                <FormattedMessage id="layouts.dashboard.nav-bar.apply.content" />
              </ConfirmDialog>
              <ConfirmDialog
                button={{
                  action: "warning",
                  label: intl.formatMessage({
                    id: "layouts.dashboard.nav-bar.reboot",
                  }),
                }}
                title={intl.formatMessage({ id: "are-you-sure" })}
                onSubmit={handleReboot}
              >
                <FormattedMessage id="layouts.dashboard.nav-bar.reboot.content" />
              </ConfirmDialog>
              <ConfirmDialog
                button={{
                  action: "light",
                  label: intl.formatMessage({
                    id: "layouts.dashboard.nav-bar.sign-out",
                  }),
                }}
                title={intl.formatMessage({ id: "are-you-sure" })}
                onSubmit={handleSignOut}
              >
                <FormattedMessage id="layouts.dashboard.nav-bar.sign-out.content" />
              </ConfirmDialog>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Widget = () => {
  return (
    <div className="fixed-grid has-4-cols">
      <div className="grid">
        <div className="cell is-col-span-4">
          <NavBar />
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Widget;
