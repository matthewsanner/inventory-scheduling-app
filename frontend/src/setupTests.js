import "@testing-library/jest-dom";
import { configure, prettyDOM } from "@testing-library/react";

configure({
  getElementError: (message, container) => {
    const snippet = prettyDOM(container, 300); // 300 chars max
    return new Error(`${message}\n\n${snippet}`);
  },
});
