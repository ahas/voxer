import { Sub } from "./sub";
export declare class App {
  private readonly sub;
  constructor(sub: Sub);
  maximize(): void;
  unmaximize(): void;
  showMenu(): void;
  hideMenu(): void;
}
