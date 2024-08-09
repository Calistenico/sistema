const path = require("path");
require("dotenv").config({
  path: process.env.STORAGE_DIR
    ? `${path.join(process.env.STORAGE_DIR, ".env")}`
    : `${path.join(__dirname, ".env")}`,
});

require("./utils/logger")();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { systemEndpoints } = require("./endpoints/system");
const { workspaceEndpoints } = require("./endpoints/workspaces");
const { chatEndpoints } = require("./endpoints/chat");
const { embeddedEndpoints } = require("./endpoints/embed");
const { embedManagementEndpoints } = require("./endpoints/embedManagement");
const { adminEndpoints } = require("./endpoints/admin");
const { inviteEndpoints } = require("./endpoints/invite");
const { utilEndpoints } = require("./endpoints/utils");
const { developerEndpoints } = require("./endpoints/api");
const { extensionEndpoints } = require("./endpoints/extensions");
const { documentEndpoints } = require("./endpoints/document");
const { piperTTSStaticEndpoint } = require("./utils/piper");
const setupTelemetry = require("./utils/telemetry");
const { Telemetry } = require("./models/telemetry");
const { workspaceThreadEndpoints } = require("./endpoints/workspaceThreads");
const {
  preloadOllamaService,
} = require("./utils/AiProviders/anythingLLM/utils/preload");
const { CommunicationKey } = require("./utils/comKey");
const { agentWebsocket } = require("./endpoints/agentWebsocket");
const { experimentalEndpoints } = require("./endpoints/experimental");
const { EncryptionManager } = require("./utils/EncryptionManager");
const { BackgroundService } = require("./utils/BackgroundWorkers");
const { whisperSTTStaticEndpoint } = require("./utils/whisper");
const app = express();
const apiRouter = express.Router();
const FILE_LIMIT = "3GB";

app.use(cors({ origin: true }));
app.use(bodyParser.text({ limit: FILE_LIMIT }));
app.use(bodyParser.json({ limit: FILE_LIMIT }));
app.use(
  bodyParser.urlencoded({
    limit: FILE_LIMIT,
    extended: true,
  })
);

if (!!process.env.ENABLE_HTTPS) {
  bootSSL(app, process.env.SERVER_PORT || 3001);
} else {
  require("@mintplex-labs/express-ws").default(app); // load WebSockets in non-SSL mode.
}

app.use("/api", apiRouter);
systemEndpoints(apiRouter);
extensionEndpoints(apiRouter);
workspaceEndpoints(apiRouter);
workspaceThreadEndpoints(apiRouter);
chatEndpoints(apiRouter);
adminEndpoints(apiRouter);
inviteEndpoints(apiRouter);
embedManagementEndpoints(apiRouter);
utilEndpoints(apiRouter);
documentEndpoints(apiRouter);
agentWebsocket(apiRouter);
experimentalEndpoints(apiRouter);
developerEndpoints(app, apiRouter);
piperTTSStaticEndpoint(app);
whisperSTTStaticEndpoint(app);

// Externally facing embedder endpoints
embeddedEndpoints(apiRouter);

app.all("*", function (_, response) {
  response.sendStatus(404);
});

app
  .listen(process.env.SERVER_PORT || 3001, async () => {
    await setupTelemetry();
    await preloadOllamaService();
    new CommunicationKey(true);
    new EncryptionManager();
    new BackgroundService().boot();
    console.log(
      `[${
        process.env.NODE_ENV || "development"
      }] AnythingLLM Standalone Backend listening on port ${
        process.env.SERVER_PORT || 3001
      }`
    );
  })
  .on("error", function (err) {
    process.once("SIGUSR2", function () {
      Telemetry.flush();
      console.error(err);
      process.kill(process.pid, "SIGUSR2");
    });
    process.on("SIGINT", function () {
      Telemetry.flush();
      console.log("SIGINT");
      process.kill(process.pid, "SIGINT");
    });
  });
