import { html, css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import litLogo from "./assets/lit.svg";

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement("my-element")
export class MyElement extends LitElement {
  /**
   * The number of times the button has been clicked.
   */
  @property({ type: Number })
  count = 0;

  @property({ type: String })
  message = "";

  constructor() {
    super();
    voxer.handle("message", (v) => (this.message = v));
  }

  render() {
    return html`
      <div>
        <a href="https://lit.dev" target="_blank">
          <img src=${litLogo} class="logo lit" alt="Lit logo" />
        </a>
      </div>

      <slot></slot>

      <div class="buttons">
        <button part="button" @click=${this._increase}>Increase<br />Count = ${this.count}</button>
        <button part="button" @click=${this._reset}>Reset</button>
        <button part="button" @click=${app.maximize}>Maximize</button>
        <button part="button" @click=${app.unmaximize}>Unmaximize</button>
        <button part="button" @click=${app.showMenu}>Show menu</button>
        <button part="button" @click=${app.hideMenu}>Hide menu</button>
      </div>

      <div class="card">
        <p>Message: ${this.message}</p>
        <p>
          Edit
          <code>view/my-element.ts</code> to test HMR
        </p>
      </div>
    `;
  }

  private _increase() {
    this.count = app.getValue();
  }

  private _reset() {
    app.setValue(0);
    this.count = 0;
  }

  static styles = css`
    :host {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }

    .logo {
      height: 6em;
      padding: 1.5em;
      will-change: filter;
    }
    .logo:hover {
      filter: drop-shadow(0 0 2em #646cffaa);
    }
    .logo.lit:hover {
      filter: drop-shadow(0 0 2em #325cffaa);
    }

    .card {
      padding: 2em;
    }

    a {
      font-weight: 500;
      color: #646cff;
      text-decoration: inherit;
    }
    a:hover {
      color: #535bf2;
    }

    button {
      border-radius: 8px;
      border: 1px solid transparent;
      padding: 0.6em 1.2em;
      font-size: 1em;
      font-weight: 500;
      font-family: inherit;
      background-color: #1a1a1a;
      cursor: pointer;
      transition: border-color 0.25s;
    }
    button:hover {
      border-color: #646cff;
    }
    button:focus,
    button:focus-visible {
      outline: 4px auto -webkit-focus-ring-color;
    }

    @media (prefers-color-scheme: light) {
      a:hover {
        color: #747bff;
      }
      button {
        background-color: #f9f9f9;
      }
    }

    .buttons {
      display: flex;
      flex-wrap: wrap;
      margin-top: 16px;
    }

    .buttons > *:not(:first-child) {
      margin-left: 8px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "my-element": MyElement;
  }
}
