import { voxer, Expose, Injectable, Invoke } from "#voxer";

@Injectable({ as: "dep" })
export class Dependency {
  @Expose()
  @Invoke("message")
  async getAsyncMessage() {
    return "Asynchronous message from Dependency";
  }

  @Expose()
  @Invoke("message")
  getSyncMessage() {
    return "Synchronous message from Dependency";
  }
}
