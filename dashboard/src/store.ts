import { configureStore } from "@reduxjs/toolkit";

import layoutReducer from "./reducers/layout";
import sessionReducer from "./reducers/session";
import notificationReducer from "./reducers/notification";

const store = configureStore({
  reducer: {
    layout: layoutReducer,
    session: sessionReducer,
    notification: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

export default store;
