<script>
  const maximize = () => app.maximize();
  const unmaximize = () => app.unmaximize();
</script>

<button on:click={maximize}>Maximize</button>
<button on:click={unmaximize}>Unmaximize</button>
