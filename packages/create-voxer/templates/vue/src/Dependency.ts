import { Expose, Injectable, Invoke } from "#voxer";

@Injectable({
  as: "dep",
})
export class Dependency {
  @Expose()
  @Invoke("message")
  foo() {
    return "Message from Dependency";
  }
}
