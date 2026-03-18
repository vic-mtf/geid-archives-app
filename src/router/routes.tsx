import React from "react";
import AppTest from "../test/App.test";
import Archives from "../views/Archives";
import type { RouteObject } from "react-router-dom";

interface RawRoute {
  element: React.ComponentType;
  path: string;
}

const routes: RawRoute[] = [
  {
    element: AppTest,
    path: "/test",
  },
  {
    element: Archives,
    path: "*",
  },
];

const parseRouter = ({ element, ...data }: RawRoute): RouteObject => ({
  element: React.createElement(element),
  ...data,
});

export default routes.map(parseRouter);
