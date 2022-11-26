<script lang="ts">
  import svelteLogo from "./assets/svelte.svg";
  import Counter from "./lib/Counter.svelte";
  import WindowSizeControl from "./lib/WindowSizeControl.svelte";
  import MenuVisibilityControl from "./lib/MenuVisibilityControl.svelte";

  let message: string;
  voxer.handle("message", (v) => (message = v));
</script>

<main>
  <div>
    <a href="https://svelte.dev" target="_blank">
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>

  <h1>VOXER</h1>

  <div class="buttons">
    <Counter />
    <WindowSizeControl />
    <MenuVisibilityControl />
  </div>

  <div class="card">
    <p id="msg">Message: {message}</p>
    <p>
      Edit
      <code>view/App.svelte</code> to test HMR
    </p>
  </div>
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
</style>
