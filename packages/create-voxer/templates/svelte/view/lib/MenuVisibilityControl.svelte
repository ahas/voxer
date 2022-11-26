<script>
  const showMenu = () => app.showMenu();
  const hideMenu = () => app.hideMenu();
</script>

<button on:click={showMenu}>Show menu</button>
<button on:click={hideMenu}>Hide menu</button>
