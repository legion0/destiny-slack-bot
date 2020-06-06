import express from "express";
import winston from "winston";
import yargs from "yargs";
import { Datastore } from "@google-cloud/datastore";
import expressWinston from "express-winston";
import _ from "lodash";

console.log(process.env);

const datastore = new Datastore();

const insertVisit = (visit) => {
  return datastore.save({
    key: datastore.key("visit"),
    data: visit,
  });
};

const getVisits = async () => {
  const query = datastore
    .createQuery("visit")
    .order("timestamp", { descending: true })
    .limit(10);

  return datastore.runQuery(query);
};

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

app.post("/kadi", async (req, res) => {
  const visit = {
    timestamp: new Date(),
    // Store a hash of the visitor's ip address
    userIp: "123",
  };
  await insertVisit(visit);
  const [entities] = await getVisits();
  console.log(entities);
  parser.parse(req.body.text, function (err, argv, output) {
    if (output) {
      res.send(ephemeralResponse(output));
    } else if (err) {
      res.send(ephemeralResponse(err));
    } else if (argv) {
      let cmdOut = null;
      switch (argv._[0]) {
        case "createActivity":
          cmdOut = createActivity(req.body, argv.name);
          break;
      }
      if (_.isNumber(cmdOut)) {
        res.sendStatus(cmdOut);
      } else if (_.isObject(cmdOut) || _.isString(cmdOut)) {
        res.send(cmdOut);
      } else {
        res.sendStatus(200);
      }
    }
  });
});

function ephemeralResponse(text: string) {
  return {
    response_type: "ephemeral",
    text: text,
  };
}

function inChannelResponse(text: string) {
  return {
    response_type: "in_channel",
    text: text,
  };
}

function createActivity(reqBody, name: string) {
  return inChannelResponse(
    `${reqBody.user_name} created a new activity [${name}]`
  );
}

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}/ ...`);
});
