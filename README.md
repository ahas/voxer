**로고가 필요해 ~ !**

# Voxer

> Vite와 Electron의 조합으로 더 간편한 크로스 플랫폼 데스크탑 애플리케이션을 만들어보세요.

# 주의
아직 상용 서비스 레벨에 사용하기에 적절한 완성도가 아닙니다.

해당 문서는 현재 작성중이며 프로젝트는 완전한 테스트를 거치지 않았습니다.

이 README는 영어로 번역될 예정입니다.

# 특징

- Vite를 기반으로 한 모던 웹 개발 환경 지원
- 간편한 Preload 지원
- Main과 Renderer 프로세스간 통신 간소화
- 데코레이터를 사용한 개발 지원
- electron-builder 기본 지원

# 설치

```bash
npm insgall -g voxer
```

# 프로젝트 생성
```bash
# NPM
npx create-voxer my-app
cd my-app
npm install
npm run dev

# Yarn
yarn create voxer my-app
cd my-app
yarn install
yarn dev
```

# 프로젝트 구조

```bash
voxer-app/
├─ .voxer/
├─ src/
│  ├─ main.ts
│  └─ tsconfig.json
├─ view/
│  └─ ...
└─ package.json

```

기본적으로 Voxer 프로젝트는 최상단에 .voxer 폴더, src, view 폴더가 있습니다.
.voxer 폴더는 개발용 빌드에 대한 리소스가 포함되어 있으며 Voxer 에 의해 자동 생성됩니다.

src 폴더는 Main 프로세스에 대한 소스 코드들이 포함되며 view 폴더는 프론트엔드단의 리소스들이 포함됩니다.

## src/main.ts

```ts
import { BrowserWindow } from "electron";
import { voxer } from "#app"; // Voxer가 자동적으로 포함시키는 리소스에 대한 단축경로
import { App } from "./app"; // 유저가 임의로 구현한 애플리케이션 모델

// 애플리케이션 실행 시 제일 먼저 호출되는 함수
export async function main(win: BrowserWindow) {
  win.setTitle("My Voxer App");
  win.setSize(800, 600);
}

// Electron의 Preload 실행 시 호출되는 함수
export function preload() {}

// Voxer에서 애플리케이션 모델에 대한 의존성 주입시 호출되는 함수
export function inject() {
  return [App];
}
```

Voxer에는 세가지의 예약된 함수가 있습니다.

**main**: export된 함수는 애플리케이션 실행 시 가장 먼저 호출됩니다.
첫번째 매개변수로 메인 BrowserWindow가 전달됩니다.
필수적으로 선언되어야 하는 함수입니다.

**preload**: Electron에서 preload.js를 실행 시에 호출되는 함수입니다.
Renderer 프로세스 상에서 실행됩니다.
꼭 선언하지 않아도 되는 함수입니다.

**inject**: Voxer에서 의존성 주입시에 호출되는 함수입니다.
Injectable 데코레이터가 선언된 클래스를 반환해야합니다.
꼭 선언하지 않아도 되는 함수입니다.

# 의존성 주입

Voxer는 NestJS 또는 Spring과 비슷한 느낌으로 의존성 주입을 사용할 수 있습니다.

```ts
import { Injectable } from "#app";
import { Sub } from "./sub";

@Injectable({
  inject: [Sub],
})
export class App {
  constructor(private readonly sub: Sub) {}
}
```

아직까지는 매우 제한적인 기능이므로 피드백이 이루어지는 대로 기능을 추가하겠습니다.

# 데코레이터

## Expose

기존 Electron만 사용한 방식에서 Renderer와 Main 프로세스를 분리하기 위해서는 preload.js 상에서 contextBridge를 통한 exposeInMainWorld 함수를 사용하여 분리된 프로세스 사이를 연결해줄 수 있는 함수를 생성해줘야 했습니다.

```ts
// Preload
const { contextBridge } from "electron";

contextBridge.exposeInMainWorld("App", {
  doThing: () => ipcRenderer.send("do-a-thing");
});

// Renderer
window.App.doThing();
```

Voxer에서는 해당 절차를 간소화한 Expose 데코레이터를 사용하여
코드를 더욱 깔끔하게 작성할 수 있습니다.

```ts
// main.ts
import { App } from "./app";

export function inject() {
  return [App];
}

// app.ts
@Injectable()
export class App {
  @Expose()
  doThing() {
    console.log("do-a-thing");
  }
}

// Renderer
window.App.doThing();
```

## Command

Voxer는 Mousetrap 라이브러리를 기본적으로 내장하고 있어 단축키를 간편하게 등록할 수 있습니다.

```ts
@Injectable()
export class App {
  @Command("ctrl+c")
  copy() {
    /* 복사 작업 */
  }

  @Command(["command+z", "ctrl+z"])
  undo() {
    /* 되돌리기 작업 */
  }
}
```

Command 데코레이터는 Mousetrap.bind를 사용하여 단축키를 등록합니다.
Mousetrap에 대한 사용법은 [이곳](https://github.com/ccampbell/mousetrap)에서 확인하세요.

## OnMain & OnRenderer

ipcRenderer와 ipcMain에 on을 호출하는 것과 동일한 기능을 합니다.

```ts
@Injectable()
export class App {
  @OnMain("foo")
  foo() {}

  @OnRenderer("bar")
  bar() {}
}

// 이것과 동일합니다.
ipcMain.on("foo", () => {});
ipcRenderer.on("bar", () => {});
```

# 유용한 함수

## handle & invoke

Renderer -> Main 방향의 함수 호출은 Expose 된 함수를 호출하는 것으로 간단하지만
반대로 Main -> Renderer 방향의 함수 호출은 구현하기 까다롭습니다.

Voxer에서는 handle과 invoke 함수로 간단하게 구현할 수 있습니다.

```ts
// Renderer
const { voxer } = window;

voxer.events.handle("add", (a, b, c) => {
  return a + b + c;
});

// Main
import { BrowserWindow } from "electron";
import { voxer } from "#app";

export async function main(win: BrowserWindow) {
  // 첫번째 매개변수로 BrowserWindow
  // 두번째 매개변수로 호출할 함수 이름
  // 그 이후로는 전달할 매개변수 입니다.
  // 실행 결과를 담은 Promise를 반환합니다.
  const result = await voxer.invoke(win, "add", 1, 2, 3);
  console.log("실행 결과는 %d 입니다.", result);
  // > 실행 결과는 6 입니다.
}
```

# 라이센스
MIT (라이센스 파일 추가 예정)