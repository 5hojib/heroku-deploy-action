const p = require("phin");
const core = require("@actions/core");
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Support Functions
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Check if Heroku is installed
const isHerokuInstalled = () => {
  try {
    execSync("heroku --version", { stdio: "ignore" });
    console.log("Heroku is already installed.");
  } catch (error) {
    console.log("Heroku is not installed. Installing...");
    execSync("curl https://cli-assets.heroku.com/install.sh | sh", {
      stdio: "inherit",
    });
    console.log("Heroku installation completed.");
  }
};

const createCatFile = ({ email, api_key }) => `cat >~/.netrc <<EOF
machine api.heroku.com
    login ${email}
    password ${api_key}
machine git.heroku.com
    login ${email}
    password ${api_key}
EOF`;

const addRemote = ({ app_name, buildpack, region, team, stack }) => {
  try {
    execSync("heroku git:remote --app " + app_name);
    console.log("Added git remote heroku");
  } catch (err) {
    execSync(
      "heroku create " +
        app_name +
        (buildpack ? " --buildpack " + buildpack : "") +
        (region ? " --region " + region : "") +
        (stack ? " --stack " + stack : "") +
        (team ? " --team " + team : "")
    );
  }
};

const addConfig = ({ app_name, appdir }) => {
  let configVars = [];
  for (let key in process.env) {
    if (key.startsWith("HD_")) {
      configVars.push(key.substring(3) + "='" + process.env[key] + "'");
    }
  }
  if (configVars.length !== 0) {
    execSync(`heroku config:set --app=${app_name} ${configVars.join(" ")}`);
  }
};

// Function to run commands with real-time log streaming
const runCommand = (command, options = {}) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, { shell: true, ...options });

    process.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    process.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
};

const deploy = async ({ app_name, branch, usedocker, dockerHerokuProcessType, dockerBuildArgs, appdir }) => {
  if (usedocker) {
    await runCommand(`heroku stack:set container --app ${app_name}`);
    await runCommand(
      `heroku container:push ${dockerHerokuProcessType} --app ${app_name} ${dockerBuildArgs}`,
      appdir ? { cwd: appdir } : null
    );
    await runCommand(
      `heroku container:release ${dockerHerokuProcessType} --app ${app_name}`,
      appdir ? { cwd: appdir } : null
    );
  } else {
    let remote_branch = execSync(
      "git remote show heroku | grep 'HEAD' | cut -d':' -f2 | sed -e 's/^ *//g' -e 's/ *$//g'"
    )
      .toString()
      .trim();

    if (remote_branch === "master") {
      await runCommand("heroku plugins:install heroku-repo");
      await runCommand("heroku repo:reset -a " + app_name);
    }

    if (appdir === "") {
      await runCommand(`git push heroku ${branch}:refs/heads/main --force`, {
        maxBuffer: 104857600,
      });
    } else {
      await runCommand(
        `git push --force heroku \`git subtree split --prefix=${appdir} ${branch}\`:refs/heads/main`,
        { maxBuffer: 104857600 }
      );
    }
  }
  core.setOutput('output', 'Deployment complete.');
};

// Input Variables
let heroku = {
  api_key: core.getInput("heroku_api_key"),
  email: core.getInput("heroku_email"),
  app_name: core.getInput("heroku_app_name"),
  buildpack: core.getInput("buildpack"),
  branch: core.getInput("branch"),
  usedocker: core.getInput("usedocker") === "false" ? false : true,
  dockerHerokuProcessType: core.getInput("docker_heroku_process_type"),
  dockerBuildArgs: core.getInput("docker_build_args"),
  appdir: core.getInput("appdir"),
  region: core.getInput("region"),
  stack: core.getInput("stack"),
  team: core.getInput("team"),
};

// Formatting
if (heroku.appdir) {
  heroku.appdir =
    heroku.appdir[0] === "." && heroku.appdir[1] === "/"
      ? heroku.appdir.slice(2)
      : heroku.appdir[0] === "/"
      ? heroku.appdir.slice(1)
      : heroku.appdir;
}

// Collate docker build args into arg list
if (heroku.dockerBuildArgs) {
  heroku.dockerBuildArgs = heroku.dockerBuildArgs
    .split("\n")
    .map((arg) => `${arg}="${process.env[arg]}"`)
    .join(",");
  heroku.dockerBuildArgs = heroku.dockerBuildArgs
    ? `--arg ${heroku.dockerBuildArgs}`
    : "";
}

(async () => {
  // Program logic
  try {
    // Check if Heroku is installed
    isHerokuInstalled();

    execSync(`git config user.name "Heroku-Deploy"`);
    execSync(`git config user.email "${heroku.email}"`);
    const status = execSync("git status --porcelain").toString().trim();
    if (status) {
      execSync(
        'git add -A && git commit -m "Commited changes from previous actions"'
      );
    }

    // Check if using Docker
    if (!heroku.usedocker) {
      const isShallow = execSync(
        "git rev-parse --is-shallow-repository"
      ).toString();

      if (isShallow === "true\n") {
        execSync("git fetch --prune --unshallow");
      }
    }

    execSync(createCatFile(heroku));
    console.log("Created and wrote to ~/.netrc");

    if (heroku.usedocker) {
      await runCommand("heroku container:login");
    }
    console.log("Successfully logged into heroku");

    addRemote(heroku);
    addConfig(heroku);

    await deploy(heroku);
  } catch (error) {
    core.setFailed(error.message);
  }
})();
