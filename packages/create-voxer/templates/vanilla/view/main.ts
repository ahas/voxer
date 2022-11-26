import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  let count: number = 0;
  const btnIncrease = document.getElementById("btn-increase") as HTMLButtonElement;
  const btnReset = document.getElementById("btn-reset") as HTMLButtonElement;
  const btnMaximize = document.getElementById("btn-maximize") as HTMLButtonElement;
  const btnUnmaximize = document.getElementById("btn-unmaximize") as HTMLButtonElement;
  const btnShowMenu = document.getElementById("btn-show-menu") as HTMLButtonElement;
  const btnHideMenu = document.getElementById("btn-hide-menu") as HTMLButtonElement;
  const msg = document.getElementById("msg") as HTMLParagraphElement;

  function updateCount() {
    btnIncrease.innerHTML = `Increase<br />Count = ${count}`;
  }

  btnIncrease.onclick = () => {
    count = app.getValue();
    updateCount();
  };

  btnReset.onclick = () => {
    app.setValue(0);
  };

  btnMaximize.onclick = () => {
    app.maximize();
  };

  btnUnmaximize.onclick = () => {
    app.unmaximize();
  };

  btnShowMenu.onclick = () => {
    app.showMenu();
  };

  btnHideMenu.onclick = () => {
    app.hideMenu();
  }

  voxer
    .handle("message", (v) => (msg.innerHTML = `Message: ${v}`))
    .handle("count", (v) => {
      count = v;
      updateCount();
    });

  updateCount();
});
