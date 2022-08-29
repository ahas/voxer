const fs = require("fs");
const { resolve } = require("path");

const templatesDir = resolve(__dirname, "../templates");
const templates = fs.readdirSync(templatesDir);
const voxerPackageJsonPath = resolve(__dirname, "../../voxer/package.json");
const voxerPackageJson = JSON.parse(fs.readFileSync(voxerPackageJsonPath).toString());
const prettier = require("prettier");

module.exports = (env) => {
  for (const template of templates) {
    const packageJsonPath = resolve(templatesDir, template, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      continue;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    if (env === "production") {
      packageJson.devDependencies.voxer = voxerPackageJson.version;
    } else {
      packageJson.devDependencies.voxer = "file:../../../voxer";
    }

    fs.writeFileSync(
      packageJsonPath,
      prettier.format(JSON.stringify(packageJson, null, 4), {
        parser: "json",
        printWidth: 120,
        tabWidth: 4,
        useTabs: false,
      })
    );
  }

  if (env === "production") {
    console.log("Voxer version of all templates are set to", voxerPackageJson.version);
  } else {
    console.log("Voxer version of all templates are set to repository voxer");
  }
};
