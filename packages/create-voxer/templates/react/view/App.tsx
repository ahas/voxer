import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const increase = () => {
    const count = app.getValue();
    setCount(count);
  };
  const reset = () => {
    app.setValue(0);
    setCount(0);
  };

  voxer.handle("message", (v) => setMessage(v));

  return (
    <div className="App">
      <div>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
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
          Edit <code>view/App.tsx</code> and save to test HMR
        </p>
      </div>
    </div>
  );
}

export default App;
