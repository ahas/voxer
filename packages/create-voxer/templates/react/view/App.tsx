import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const { App } = window;

  return (
    <div className="App">
      <div>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Voxer + React</h1>
      <div className="buttons">
        <button type="button" onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button type="button" onClick={() => App.maximize()}>
          Maximize
        </button>
        <button type="button" onClick={() => App.unmaximize()}>
          Minimize
        </button>
        <button type="button" onClick={() => App.showMenu()}>
          Show Menu
        </button>
        <button type="button" onClick={() => App.hideMenu()}>
          Hide Menu
        </button>
      </div>
      <div className="card">
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </div>
  );
}

export default App;
