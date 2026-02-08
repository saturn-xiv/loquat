import { useEffect } from "react";
import { useNavigate } from "react-router";

import {
  SIGN_IN as USERS_SIGN_IN,
  LOGS as USER_LOGS,
  get as get_token,
} from "../reducers/session";

const Widget = () => {
  const navigate = useNavigate();
  const token = get_token();
  useEffect(() => {
    navigate(token ? USER_LOGS : USERS_SIGN_IN);
  }, [token, navigate]);

  return <></>;
};

export default Widget;
