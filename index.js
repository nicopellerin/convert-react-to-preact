#!/usr/bin/env node
const { program } = require("commander")
const inquirer = require("inquirer")
const fs = require("fs")
const execa = require("execa")
const chalk = require("chalk")
const emoji = require("node-emoji")
const ora = require("ora")

async function readPackageJson() {
  const packageJson = await fs.promises.readFile("package.json", "utf-8")
  const parsedPJ = JSON.parse(packageJson)
  const dependencies = Object.keys(parsedPJ.dependencies)
  return dependencies
}

let dependencies
readPackageJson().then((data) => (dependencies = data))

async function runInquirer() {
  program.version("0.0.1").description("Converts React app to using Preact X")
  program.parse(process.argv)

  console.log(
    chalk.bgGray.magentaBright("Converts React app to using Preact X")
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

  return { packageManager, framework }
}

function getInstallArgs(packageManager, framework) {
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

  return { count, total, command }
}

function doneInstall(start, spinner) {
  const time = Date.now() - start
  spinner.stop()
  console.log(
    "\n" + emoji.get("white_check_mark"),
    chalk.bold.green("Done!"),
    chalk.gray(`${time / 1000}s`)
  )
}

async function runProcessing() {
  try {
    const { packageManager, framework } = await runInquirer()
    let { count, total, command } = getInstallArgs(packageManager, framework)

    const start = Date.now()

    // Start
    console.log(
      "\n" + emoji.get("stopwatch"),
      chalk.cyan(" Starting conversion...")
    )
    const spinner = ora()
    spinner.start()

    // Removes react
    if (dependencies.includes("react")) {
      console.log(
        chalk.gray(`[${count}/${total}]`),
        chalk.bold.red(`Removing`),
        "react"
      )
      count++
      await execa(packageManager, [command.remove, "react"])
    }

    // Removes react-dom
    if (dependencies.includes("react-dom")) {
      console.log(
        chalk.gray(`[${count}/${total}]`),
        chalk.bold.red(`Removing`),
        "react-dom"
      )
      count++
      await execa(packageManager, [command.remove, "react-dom"])
    }

    // Adds preact
    console.log(
      chalk.gray(`[${count}/${total}]`),
      chalk.bold.blueBright(`Adding`),
      "preact"
    )
    count++

    await execa(packageManager, [command.add, "preact"])

    // Adds preact-compat alias
    console.log(
      chalk.gray(`[${count}/${total}]`),
      chalk.bold.blueBright(`Adding`),
      "preact-compat alias"
    )
    count++
    await execa(packageManager, [
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
    await execa(packageManager, [command.add, "preact-render-to-string"])

    // Adds preact-ssr-prepass alias
    if (framework === "Next.js") {
      console.log(
        chalk.gray(`[${count}/${total}]`),
        chalk.bold.blueBright(`Adding`),
        "preact-ssr-prepass alias"
      )
      await execa(packageManager, [
        command.add,
        "react-ssr-prepass@npm:preact-ssr-prepass",
      ])
    }

    doneInstall(start, spinner)
  } catch (err) {
    console.error(chalk.red("Something wrong occured!", err))
  }
}

runProcessing()
