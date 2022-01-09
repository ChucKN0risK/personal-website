import "vite/dynamic-import-polyfill";
import "./css/index.css"
import "./css/spacing.css"

function init() {
  // A demo: add an element to the document, then announce it
  const alertNode = document.createElement("div");
  const mainNode = document.querySelector("main");

  alertNode.setAttribute("role", "status");
  alertNode.setAttribute("aria-live", "polite");
  mainNode.appendChild(alertNode);

  // Wait some arbitrary time, then populate it
  setTimeout(() => {
    const successNode = document.createElement("p");
    // Let's verify that Vite is injecting environment variables
    // @see https://vitejs.dev/guide/env-and-mode.html#env-variables
    if (import.meta.env.DEV === true) {
      successNode.innerText = "Vite is serving the script correctly!";
    }
    alertNode.appendChild(successNode);
  }, 400);
}

init();
