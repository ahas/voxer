import { inject } from "#voxer";
import { Application } from "./Application";
import { appMenu } from "./menu";

export async function main() {
  const app = inject(Application);
  app.setApplicationMenu(appMenu);
}
