const chalk = require("chalk");
const { RetryError } = require("../error");
const SOCKET_TIMEOUT_MS = 300 * 1_000; // 5 mins

/**
 * Websocket Interface plugin. It prints the messages on the console and asks for feedback
 * while the conversation is running in the background.
 */

// export interface AbitatWebSocket extends ServerWebSocket<unknown> {
//   askForFeedback?: any
//   awaitResponse?: any
//   handleFeedback?: (message: string) => void;
// }

const websocket = {
  name: "websocket",
  startupConfig: {
    params: {
      socket: {
        required: true,
      },
      muteUserReply: {
        required: false,
        default: true,
      },
      introspection: {
        required: false,
        default: true,
      },
    },
  },
  plugin: function ({
    socket, // @type AbitatWebSocket
    muteUserReply = true, // Do not post messages to "USER" back to frontend.
    introspection = false, // when enabled will attach socket to Aibitat object with .introspect method which reports status updates to frontend.
  }) {
    return {
      name: this.name,
      setup(aibitat) {
        aibitat.onError(async (error) => {
          console.error(chalk.red(`   error: ${error?.message}`));
          if (error instanceof RetryError) {
            console.error(chalk.red(`   retrying in 60 seconds...`));
            setTimeout(() => {
              aibitat.retry();
            }, 60000);
            return;
          }
        });

        aibitat.introspect = (messageText) => {
          if (!introspection) return; // Dump thoughts when not wanted.
          socket.send(
            JSON.stringify({ type: "statusResponse", content: messageText })
          );
        };

        // expose function for sockets across abitat
        // type param must be set or else msg will not be shown or handled in UI.
        aibitat.socket = {
          send: (type = "__unhandled", content = "") => {
            socket.send(JSON.stringify({ type, content }));
          },
        };

        // aibitat.onStart(() => {
        //   console.log("🚀 starting chat ...");
        // });

        aibitat.onMessage((message) => {
          if (message.from === "USER" && muteUserReply) return;
          socket.send(JSON.stringify(message));
        });

        aibitat.onTerminate(() => {
          // console.log("🚀 chat finished");
          socket.close();
        });

        aibitat.onInterrupt(async (node) => {
          const feedback = await socket.askForFeedback(socket, node);
          if (
            ["exit", "/exit", "stop", "/stop", "halt", "/halt"].includes(
              feedback
            )
          ) {
            socket.close();
            return;
          }

          await aibitat.continue(feedback);
        });

        /**
         * Socket wait for feedback on socket
         *
         * @param socket The content to summarize. // AbitatWebSocket & { receive: any, echo: any }
         * @param node The chat node // { from: string; to: string }
         * @returns The summarized content.
         */
        socket.askForFeedback = (socket, node) => {
          socket.awaitResponse = (question = "waiting...") => {
            socket.send(JSON.stringify({ type: "WAITING_ON_INPUT", question }));

            return new Promise(function (resolve) {
              socket.handleFeedback = (message) => {
                const data = JSON.parse(message);
                if (data.type !== "awaitingFeedback") return;
                delete socket.handleFeedback;
                resolve(data.feedback);
                return;
              };

              setTimeout(() => {
                console.log(
                  chalk.red(
                    `Client took too long to respond, chat thread is dead after ${SOCKET_TIMEOUT_MS}ms`
                  )
                );
                resolve("exit");
                return;
              }, SOCKET_TIMEOUT_MS);
            });
          };

          return socket.awaitResponse(`Provide feedback to ${chalk.yellow(
            node.to
          )} as ${chalk.yellow(node.from)}.
           Press enter to skip and use auto-reply, or type 'exit' to end the conversation: \n`);
        };
        // console.log("🚀 WS plugin is complete.");
      },
    };
  },
};

module.exports = {
  websocket,
};
