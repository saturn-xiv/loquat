import { Outlet } from "react-router";

import NotificationBar from "../components/NotificationBar";
import FooterBar from "../components/FooterBar";

const Widget = () => {
  return (
    <div className="container">
      <NotificationBar />
      <Outlet />
      <FooterBar />
    </div>
  );
};

export default Widget;
