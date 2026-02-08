import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

const UsersSignIn = lazy(() => import("./pages/users/sign-in"));
const UsersLogs = lazy(() => import("./pages/users/logs"));
const UsersProfile = lazy(() => import("./pages/users/profile"));
const MembersIndex = lazy(() => import("./pages/members"));
const InterfacesIndex = lazy(() => import("./pages/interfaces"));
const RulesIndex = lazy(() => import("./pages/rules"));
const HostsIndex = lazy(() => import("./pages/hosts"));
const DashboardIndex = lazy(() => import("./pages/dashboard"));
const Graphiql = lazy(() => import("./pages/graphiql"));
const RootLayout = lazy(() => import("./layouts/Root"));
const AnonymousLayout = lazy(() => import("./layouts/Anonymous"));
const DashboardLayout = lazy(() => import("./layouts/Dashboard"));
const Home = lazy(() => import("./pages/home"));

const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: RootLayout,
      children: [
        { index: true, Component: Home },
        { path: "graphiql", Component: Graphiql },
        {
          path: "anonymous",
          Component: AnonymousLayout,
          children: [{ path: "sign-in", Component: UsersSignIn }],
        },
        {
          path: "dashboard",
          Component: DashboardLayout,
          children: [
            { index: true, Component: DashboardIndex },
            { path: "interfaces", Component: InterfacesIndex },
            { path: "hosts", Component: HostsIndex },
            {
              path: "members",
              Component: MembersIndex,
            },
            { path: "rules", Component: RulesIndex },
            {
              path: "account",
              children: [
                { path: "logs", Component: UsersLogs },
                { path: "profile", Component: UsersProfile },
              ],
            },
          ],
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

const Widget = () => {
  return <RouterProvider router={router} />;
};

export default Widget;
