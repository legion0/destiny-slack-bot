import express from "express";
import winston from "winston";
import yargs from "yargs";

import expressWinston from "express-winston";

const app = express();

app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.json());
app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    ),
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) {
      return false;
    }, // optional: allows to skip some log messages based on request and/or response
  })
);

app.get("/", (req, res) => {
  res.send("Hello from App Engine!");
});

const parser = yargs
  .strict()
  .scriptName("/kadi")
  .usage("$0 <cmd> [args]")
  .command("createActivity <name>", "Creates a new activity", (yargs) => {
    yargs.positional("name", {
      type: "string",
      describe: "the name of the activity",
    });
  })
  .showHelpOnFail(true)
  .help()
  .demandCommand(1, "no command provided, see help");

app.post("/kadi", (req, res) => {
  parser.parse(req.body.text, function (err, argv, output) {
    if (output) {
      res.send(output);
    } else if (err) {
      res.send(err);
    } else if (argv) {
      switch (argv._[0]) {
        case "createActivity":
          let cmdOut = createActivity(argv.name);
          res.send(cmdOut);
          break;
        default:
          res.send("default switch");
      }
    }
  });
});

function createActivity(name) {
  return `Created Activity named [${name}]`;
}

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}/ ...`);
});

function runCommand(command, ...args) {}
