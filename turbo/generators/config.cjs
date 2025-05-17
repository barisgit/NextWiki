const { execSync } = require("child_process");
const fs = require("fs");

// @ts-check - Enable type checking for this file
/** @typedef {import('@turbo/gen').PlopTypes.NodePlopAPI} NodePlopAPI */

// Learn more about Turborepo Generators at https://turbo.build/repo/docs/core-concepts/monorepos/code-generation

/**
 * @param {NodePlopAPI} plop
 */
module.exports = function generator(plop) {
  // Register the 'eq' helper
  plop.addHelper("eq", (a, b) => a === b);

  // A simple generator to create a new package
  plop.setActionType("runCommand", function (answers, config, plop) {
    if (!config || !config.data) {
      throw new Error("Config is required");
    }

    // @ts-ignore
    const command = `pnpm ${config.data.command}`;

    try {
      execSync(command, {
        encoding: "utf8",
        stdio: "inherit",
        cwd: config.data.currentDir,
      }); // Use inherit to show logs in console
      return "success";
    } catch (error) {
      console.error(error);
      return "error";
    }
  });

  plop.setActionType("checkDirEmpty", function (answers, config, plop) {
    const dir =
      config.data.currentDir + "/" + config.data.folder + "/" + answers.name;
    const dirExists = fs.existsSync(dir);
    if (!dirExists) {
      return "success";
    }
    const files = fs.readdirSync(dir);
    if (files.length === 0) {
      return "success";
    } else {
      console.error("[ERROR] Directory is not empty, exiting...");
      process.exit(1);
    }
  });

  plop.setGenerator("package", {
    description: "Adds a new package to the monorepo",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the package? (e.g. utils, logger)",
      },
      {
        type: "list",
        name: "type",
        message: "What is the type of the package?",
        default: "base",
        choices: ["base", "react-library", "nextjs"],
      },
    ],
    actions: [
      {
        type: "checkDirEmpty",
        data: {
          currentDir: plop.getDestBasePath(),
          folder: "packages",
        },
      },
      {
        type: "addMany",
        destination: "{{ turbo.paths.root }}/packages/{{ name }}",
        base: "templates/package",
        templateFiles: "templates/package/**/*",
        // Ensure dotfiles are copied
        globOptions: { dot: true },
      },
      {
        type: "runCommand",
        data: {
          command: "install",
          currentDir: plop.getDestBasePath(),
        },
      },
    ],
  });
};
