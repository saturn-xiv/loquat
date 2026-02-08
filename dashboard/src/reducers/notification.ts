import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { GraphQLError } from "graphql";

import type { RootState } from "../store";

interface INotificationState {
  action?: string;
  messages: string[];
}

const initialState: INotificationState = { messages: [] };

export const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    info: (state, action: PayloadAction<string[]>) => {
      state.action = "info";
      state.messages = action.payload;
    },
    link: (state, action: PayloadAction<string[]>) => {
      state.action = "link";
      state.messages = action.payload;
    },
    primary: (state, action: PayloadAction<string[]>) => {
      state.action = "primary";
      state.messages = action.payload;
    },
    success: (state, action: PayloadAction<string[]>) => {
      state.action = "success";
      state.messages = action.payload;
    },
    warning: (state, action: PayloadAction<string[]>) => {
      state.action = "warning";
      state.messages = action.payload;
    },
    danger: (state, action: PayloadAction<GraphQLError[]>) => {
      state.action = "danger";
      state.messages = action.payload.map((it) => it.message);
    },
    close: (state) => {
      state.action = undefined;
      state.messages = [];
    },
  },
});

export const { link, info, primary, success, warning, danger, close } =
  layoutSlice.actions;

export const selectNotification = (state: RootState) => state.notification;

export default layoutSlice.reducer;
