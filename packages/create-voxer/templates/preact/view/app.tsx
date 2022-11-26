import { useState } from "preact/hooks";
import preactLogo from "./assets/preact.svg";
import "./app.css";

export function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage ] = useState("");

  const increase = () => {
    const count = app.getValue();
    setCount(count);
  };

  const reset = () => {
    app.setValue(0);
    setCount(0);
  }

  voxer.handle("message", v => setMessage(v));

  return (
    <>
      <div>
        <a href="https://preactjs.com" target="_blank">
          <img src={preactLogo} class="logo preact" alt="Preact logo" />
        </a>
      </div>
      <h1>VOXER</h1>
      <div className="buttons">
        <button type="button" onClick={increase}>
          Increase
          <br />
          Count = {count}
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
        <button type="button" onClick={() => app.maximize()}>
          Maximize
        </button>
        <button type="button" onClick={() => app.unmaximize()}>
          Minimize
        </button>
        <button type="button" onClick={() => app.showMenu()}>
          Show Menu
        </button>
        <button type="button" onClick={() => app.hideMenu()}>
          Hide Menu
        </button>
      </div>
      <div className="card">
        <p>Message: {message}</p>
        <p>
          Edit <code>view/app.tsx</code> and save to test HMR
        </p>
      </div>
    </>
  );
}
