#!/usr/bin/env node
const { program } = require("commander")
const inquirer = require("inquirer")
const fs = require("fs")
const { spawnSync } = require("child_process")
const chalk = require("chalk")
const emoji = require("node-emoji")

program.version("0.0.1").description("Converts React app to using Preact X")
program.parse(process.argv)

const packageJson = fs.readFileSync("package.json", "utf-8")
const parsedPJ = JSON.parse(packageJson)

// Prompt inquirer
;(async () => {
  try {
    console.log(
      chalk.bgGrey.magentaBright("Convert your React app to use Preact X\n")
    )

    const { packageManager, framework } = await inquirer.prompt([
      {
        type: "list",
        name: "packageManager",
        message: "Please select a package manager",
        choices: ["yarn", "npm"],
      },
      {
        type: "list",
        name: "framework",
        message: "Please select your framework",
        choices: ["Next.js", "Create-react-app"],
      },
    ])

    const start = Date.now()

    let count = 1
    let total = framework === "Next.js" ? "6" : "5"

    const command = { add: "", remove: "" }
    switch (packageManager) {
      case "yarn":
        command.add = "add"
        command.remove = "remove"
        break
      case "npm":
        command.add = "install -S"
        command.remove = "uninstall"
    }

    // Start
    console.log(
      "\n" + emoji.get("stopwatch"),
      chalk.cyan(" Starting conversion...")
    )

    // Removes react
    if (Object.keys(parsedPJ.dependencies).includes("react")) {
      console.log(
        chalk.gray(`[${count}/${total}]`),
        chalk.bold.red(`Removing`),
        "react"
      )
      count++
      spawnSync(packageManager, [command.remove, "react"])
    }

    // Removes react-dom
    if (Object.keys(parsedPJ.dependencies).includes("react-dom")) {
      console.log(
        chalk.gray(`[${count}/${total}]`),
        chalk.bold.red(`Removing`),
        "react-dom"
      )
      count++
      spawnSync(packageManager, [command.remove, "react-dom"])
    }

    // Adds preact
    console.log(
      chalk.gray(`[${count}/${total}]`),
      chalk.bold.blueBright(`Adding`),
      "preact"
    )
    count++
    spawnSync(packageManager, [command.add, "preact"])

    // Adds preact-compat alias
    console.log(
      chalk.gray(`[${count}/${total}]`),
      chalk.bold.blueBright(`Adding`),
      "preact-compat alias"
    )
    count++
    spawnSync(packageManager, [
      command.add,
      "preact-compat/react#1.x",
      "preact-compat/react-dom#1.x",
    ])

    // Adds preact-render-to-string
    console.log(
      chalk.gray(`[${count}/${total}]`),
      chalk.bold.blueBright(`Adding`),
      "preact-render-to-string"
    )
    count++
    spawnSync(packageManager, [command.add, "preact-render-to-string"])

    // Adds preact-ssr-prepass alias
    if (framework === "Next.js") {
      console.log(
        chalk.gray(`[${count}/${total}]`),
        chalk.bold.blueBright(`Adding`),
        "preact-ssr-prepass alias"
      )
      spawnSync(packageManager, [
        command.add,
        "react-ssr-prepass@npm:preact-ssr-prepass",
      ])
    }

    // Done
    const time = Date.now() - start

    console.log(
      emoji.get("white_check_mark"),
      chalk.bold.green("Done!"),
      chalk.gray(`${time / 1000}s`)
    )
  } catch (error) {
    console.error(chalk.red("Something wrong occured!"))
  }
})()
