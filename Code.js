"use strict";

const SLACK_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty(
  "SLACK_ACCESS_TOKEN"
);
const LOGS_SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty(
  "LOGS_SPREADSHEET_ID"
);
const BOT_USER_ID = PropertiesService.getScriptProperties().getProperty(
  "BOT_USER_ID"
);
const LOG_TO_SHEET = true;
const LOG_PII = true;

var POST_MESSAGE_ENDPOINT = "https://slack.com/api/chat.postMessage";
var TEXTS = [
  "Do you like dogs?:dog:",
  "You said the word!:grinning:",
  "I hope you like this...:poodle:",
  "Dogs are cute!:dog2: Dogs are cute!:dog2:",
  "I know, you want this.:thumbsup:",
];

/*
 * Use this function to replay post to the dev version of the script
 */
function testPost() {
  let payload = { event: { text: "test message" } };

  doPost({
    postData: {
      contents: JSON.stringify(payload),
    },
  });
}

function handlePayload(payload) {
  if (payload)
    if (payload.event.bot_id) {
      // we ignore bots for now, maybe limit to messages from self later on.
      return;
    }

  if (payload.event.text.match(/dog/)) {
    postToSlack(payload.event);
  }
}

function executeCommand(event) {
  let args = event.parameters.text[0].split(" ");
  let command = args.shift();
  // sendReply(`received command ${command}`);
  console_log("sending reply");
  return ContentService.createTextOutput(
    `ack, received command [${command}] with args [${args}]`
  );
}

function doPost(event) {
  try {
    if (LOG_PII) {
      console_log("event", event);
    }

    try {
      let payload = JSON.parse(event.postData.contents);
      if (payload.challenge) {
        // TODO: save bot id if possible here
        return ContentService.createTextOutput(payload.challenge);
      }
    } catch (e) {}

    if (event.parameters && event.parameters.command) {
      return executeCommand(event);
    }
    // if (LOG_PII) {
    //   console_log("payload", payload); // TODO: remove
    // }

    // console_log("Object.keys(payload)", Object.keys(payload));
    // if (payload.event) {
    //   console_log("Object.keys(payload.event)", Object.keys(payload.event));
    // }

    // handlePayload(payload);
  } catch (err) {
    console_log(err.name + ": " + err.message);
    sendReply(err.name + ": " + err.message, event);
  }
}

function postToSlack(event) {
  let text = TEXTS[Math.floor(Math.random() * TEXTS.length)];
  let payload = {
    token: SLACK_ACCESS_TOKEN,
    channel: event.channel,
    text: text,
  };
  UrlFetchApp.fetch(POST_MESSAGE_ENDPOINT, {
    method: "post",
    payload: payload,
  });
}

function sendReply(text, event) {
  let payload = {
    token: SLACK_ACCESS_TOKEN,
    channel: event.channel,
    text: text,
  };
  UrlFetchApp.fetch(POST_MESSAGE_ENDPOINT, {
    method: "post",
    payload: payload,
  });
}

let _consoleLogOrig = console_log;

function console_log() {
  if (LOG_TO_SHEET) {
    logToSheet(...arguments);
  }
  console.log(...arguments);
}

function logToSheet() {
  let args = Array.prototype.slice.call(arguments);
  let logMsg = "";
  if (args.length == 1 && typeof args[0] == "string") {
    logMsg = args[0];
  } else {
    logMsg = JSON.stringify(args, undefined, 2);
  }

  var sheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName(
    "logs"
  );
  sheet.appendRow([new Date(), logMsg]);
}
