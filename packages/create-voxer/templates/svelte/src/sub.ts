import { Expose, Injectable } from "#app";

@Injectable()
export class Sub {
  @Expose()
  sub() {
    console.log("Message from Sub");
  }
}
