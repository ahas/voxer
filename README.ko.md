<h1 align="center">VOXER</h1>

<p align="center">Vite + Electron</p>
<p align="center">더 간편한 크로스 플랫폼 데스크탑 개발 프레임워크</p>

## 목차

- [소개](#소개)

## 소개

`Electron`은 JavaScript, HTML, CSS를 사용하여 크로스 플랫폼 데스크탑 애플리케이션을 개발할 수 있는 프레임워크입니다.
그러나 `Electron` 단독으로 사용할 때의 개발 퍼포먼스는 매우 제한적이며 다른 프론트엔드 프레임워크와의 결합은 매우 까다로운 작업 중 하나입니다.

`voxer`는 이 문제에 대한 해결 방안으로 `Vite`을 선택했습니다.

`Vite` + `Electron` 조합을 기본으로 지원하여 보일러 플레이트 수정없이 빠르게 다양한 모던 웹 개발 환경을 구성할 수 있습니다. 또한 `Electron`을 사용하면서 불편했던 `Main`과 `Renderer` 프로세스 간 브릿지 구성을 자동화하여 더 빠르고 편리한 개발이 가능합니다.

## 기능

- `Vite`를 기반으로 한 모던 웹 개발 환경
- 데코레이터를 사용한 개발
- 100% 타입스크립트
- 백엔드 타입 자동 생성
- 더 쉬운 일렉트론 래퍼
- `electron-builder` 기본 지원

## 설치 방법

- yarn

```bash
yarn create voxer project-name
```

- npm

```bash
npm install -g create-voxer
create-voxer project-name
```

## 디렉토리 구조

```bash
project-name/
├─ src/               # main 프로세스 작업 폴더
│  ├─ main.ts         # main 프로세스 시작점
│  └─ tsconfig.json
├─ view/              # renderer 프로세스 작업 폴더
│  ├─ index.html
│  ├─ main.ts
│  ├─ style.css
│  ├─ tsconfig.json
│  └─ voxer-env.d.ts  # 프론트엔드 타입 참조 파일
├─ package.json
└─ voxer.config.ts    # voxer 설정 파일
```

## Main 프로세스

`Main` 프로세스의 시작점은 `src/main.ts` 에 선언됩니다.
main.ts는 네개의 함수 `main` `inject` `launch` `preload` 를 export 하여 `voxer` 가 사용할 수 있도록 합니다.

```ts
// src/main.ts
import { BrowserWindow, Menu } from "electron";
import { App } from "./app";

// 시작점이 되는 함수입니다. 반드시 선언되어야합니다.
// 첫번째 매개변수로 BrowserWindow를 전달받습니다.
export async function main(win: BrowserWindow) {
  win.setTitle("VOXER");
  win.setSize(800, 600);
}
```

```ts
// 의존성 주입을 실행할 클래스들을 반환하는 함수입니다.
// 의존성 주입 단원을 확인하세요.
export function inject() {
  return [App];
}
```

```ts
// 애플리케이션이 실행될 떄 호출되는 함수입니다.
export function launch() {}
```

```ts
// Renderer 프로세스의 preload가 실행될 때 호출되는 함수입니다.
export function preload() {}
```

## 의존성 주입

`voxer` 는 `NestJS` 와 유사한 형태로 의존성 주입이 가능합니다

```ts
// src/sub.ts
@Injectable()
export class Sub {
  bar() {
    console.log("bar");
  }
}
```

```ts
// src/app.ts
import { Injectable } from "#app"; // .voxer 내 소스 파일들을 가리키는 alias
import { Sub } from "./sub";

// 다른 의존성을 주입하려면 Injectable 데코레이터에 inject 옵션으로 전달하세요.
@Injectable({
  inject: [Sub],
})
export class App {
  // 주입된 의존성은 생성자 매개변수로 전달됩니다.
  // 순서는 상관 없으며 타입이 일치하면 됩니다.
  constructor(private readonly sub: Sub) {}

  foo() {
    this.sub.bar();
  }
}
```

## 데코레이터

`voxer` 는 `Electron` 기능 구현을 간소화 할 수 있는 편리한 데코레이터들을 지원합니다.

### Expose

```ts
// src/main.ts
import { Expose } from "#app";

@Injectable()
export class App {
  @Expose()
  foo() {}
}
```

`Expose` 데코레이터를 사용하면 의존성 클래스의 메소드를 `Renderer` 프로세스에서 사용할 수 있습니다.

예시 1

```ts
// Renderer 프로세스의 JavaScript 파일
app.foo();
```

예시 2

```html
<template>
  <button @click="app.foo()">Foo</button>
</template>

<script setup lang="ts">
  const { app } = window;
</script>
```

`Expose` 데코레이터는 대상 메소드를 클래스 이름([캐멀 케이스](https://en.wikipedia.org/wiki/Camel_case) 적용) 객체에 포함시켜 내보냅니다.

예를 들어 클래스 이름이 `ProgramManager` 라면 `window` 에 `programManager` 라는 이름의 객체가 생성됩니다.

```ts
// src/main.ts
import { Expose } from "#app";

@Injectable()
export class App {
  @Expose({ as: "bar" })
  foo() {}
}
```

`as` 옵션을 사용하면 대상 메소드의 이름을 변경 할 수 있습니다.

```ts
// Renderer 프로세스의 JavaScript 파일
app.bar();
```

### Accessor
`Accessor` 데코레이터는 멤버 변수에 대한 접근자를 자동 생성합니다.

```ts
// src/main.ts
import { Accessor } from "#app";

@Injectable()
export class App {
  @Accessor()
  foo: number = 1;
}
```
```ts
// Renderer 프로세스의 JavaScript 파일
let value: number;

value = app.getFoo();
console.log(value); // 1

app.setFoo(2);
value = app.getFoo();
console.log(value); // 2
```
`Accessor` 는 대상 멤버 변수의 이름을 각각 get + 이름, set + 이름 형식으로 조합하여 변수에 접근 가능한 함수를 생성합니다.

예를들어 멤버 변수명이 `userName` 이라면 `getUserName` 과 `setUserName` 함수가 생성됩니다.

```ts
// src/main.ts
import { Accessor } from "#app";

@Injectable()
export class App {
  @Accessor({ as: "bar" })
  foo: number = 1;
}
```

`Accessor` 또한 `as` 옵션을 사용하여 변수명을 변경할 수 있습니다.

```ts
const foo = app.getBar();
app.setBar(2);
```

`getter` `setter` 옵션을 사용하면 접근자명을 수동 지정할 수 있습니다.

*`getter` `setter`는 `as` 보다 우선 순위가 높습니다.*

```ts
// src/main.ts
import { Accessor } from "#app";

@Injectable()
export class App {
  @Accessor({ getter: "foofoo", setter: "barbar" })
  foo: number = 1;
}
```
```ts
const foo = app.foofoo();
app.barbar(2);
```

### Command
`Command` 데코레이터를 사용하면 `Renderer` 프로세스에서 입력된 키보드 입력으로 `Main` 프로세스의 메소드를 호출 할 수 있습니다.

키보드 이벤트는 [Mousetrap](https://github.com/ccampbell/mousetrap) 을 사용하여 등록하며 모듈은 별도로 설치하여야 합니다.

```bash
npm install mousetrap
```



### MenuItem