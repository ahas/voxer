import ejs from "ejs";
import { resolve } from "path";
import fs from "fs";
import prettier from "prettier";

const cwd = process.cwd();

export async function writeTemplate(name: string, options: any) {
    const text = fs.readFileSync(resolve(__dirname, "../assets", name + ".ejs")).toString();
    const template = ejs.compile(text);
    const output = await template({
        ...options,
    });

    fs.writeFileSync(
        resolve(cwd, ".voxer", name),
        prettier.format(output, {
            tabWidth: 4,
            parser: "typescript",
        }),
    );
}
