import { voxer, Expose, Injectable } from "#voxer";

@Injectable({ as: "dep" })
export class Dependency {
  @Expose()
  async foo() {
    await voxer.invoke("message", "Message from Dependency");
  }
}
