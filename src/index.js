//import "core-js/features/map";
//import "core-js/features/set";
import React from "react";
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { getStore } from './store.js';
import App from "./App.js";

render(
  <Provider store={getStore()}>
    <App />
  </Provider>,
  document.getElementById("root")
);

/*if (process.env.NODE_ENV === "development") {
  import("./eruda").then(({ default: eruda }) => {});
}*/