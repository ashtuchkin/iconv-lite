const { CLIEngine } = require("eslint");
const cli = new CLIEngine({});

// This hack is recommended by lint-staged authors:
// https://github.com/okonet/lint-staged#how-can-i-ignore-files-from-eslintignore-
module.exports = {
    "*.js": (files) =>
        "eslint --max-warnings=0 " + files.filter((file) => !cli.isPathIgnored(file)).join(" "),
    "*.{js,json,yml,md,ts}": "prettier --write",
};
