import { Expose, Injectable } from "#voxer";

@Injectable({
  as: "dep",
})
export class Dependency {
  @Expose()
  foo() {
    return "Message from Dependency";
  }
}
