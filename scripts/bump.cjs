const fs = require("fs");
const glob = require("fast-glob");
const { execSync } = require("child_process");

const version = process.argv[2];

if (!version || version === "") {
  console.log("Please provide a version as the second argument");
  process.exit(1);
}

let solidJsVersion = execSync("npm view solid-js version").toString().trim();

glob("packages/*/package.json").then(packages => {
  packages.forEach(packagePath => {
    const packageJson = JSON.parse(fs.readFileSync(packagePath));
    packageJson.version = version;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
  });
});

glob("examples/*/package.json").then(packages => {
  packages.forEach(packagePath => {
    const packageJson = JSON.parse(fs.readFileSync(packagePath));
    if (packageJson.dependencies?.["solid-start"]) {
      packageJson.dependencies =
        {
          ...packageJson.dependencies,
          "solid-js": "^" + solidJsVersion,
          "solid-start": "^" + version
        };
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
    }
  });
});
