<script lang="ts">
  let count = 0;

  const increment = () => {
    count = app.getValue();
  };

  const reset = () => {
    app.setValue(0);
    count = 0;
  };
</script>

<button on:click={increment}>
  Increase <br />
  Count = {count}
</button>
<button on:click={reset}>Reset</button>
