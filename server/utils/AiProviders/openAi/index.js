const { NativeEmbedder } = require("../../EmbeddingEngines/native");
const {
  handleDefaultStreamResponseV2,
} = require("../../helpers/chat/responses");

class OpenAiLLM {
  constructor(embedder = null, modelPreference = null) {
    if (!process.env.OPEN_AI_KEY) throw new Error("No OpenAI API key was set.");
    const { OpenAI: OpenAIApi } = require("openai");

    this.openai = new OpenAIApi({
      apiKey: process.env.OPEN_AI_KEY,
    });
    this.model = modelPreference || process.env.OPEN_MODEL_PREF || "gpt-4o";
    this.limits = {
      history: this.promptWindowLimit() * 0.15,
      system: this.promptWindowLimit() * 0.15,
      user: this.promptWindowLimit() * 0.7,
    };

    this.embedder = embedder ?? new NativeEmbedder();
    this.defaultTemp = 0.7;
  }

  #appendContext(contextTexts = []) {
    if (!contextTexts || !contextTexts.length) return "";
    return (
      "\nContext:\n" +
      contextTexts
        .map((text, i) => {
          return `[CONTEXT ${i}]:\n${text}\n[END CONTEXT ${i}]\n\n`;
        })
        .join("")
    );
  }

  streamingEnabled() {
    return "streamGetChatCompletion" in this;
  }

  static promptWindowLimit(modelName) {
    switch (modelName) {
      case "gpt-3.5-turbo":
      case "gpt-3.5-turbo-1106":
        return 16_385;
      case "gpt-4o":
      case "gpt-4o-2024-08-06":
      case "gpt-4o-2024-05-13":
      case "gpt-4o-mini":
      case "gpt-4o-mini-2024-07-18":
      case "gpt-4-turbo":
      case "gpt-4-1106-preview":
      case "gpt-4-turbo-preview":
        return 128_000;
      case "gpt-4":
        return 8_192;
      case "gpt-4-32k":
        return 32_000;
      default:
        return 4_096; // assume a fine-tune 3.5?
    }
  }

  promptWindowLimit() {
    switch (this.model) {
      case "gpt-3.5-turbo":
      case "gpt-3.5-turbo-1106":
        return 16_385;
      case "gpt-4o":
      case "gpt-4o-2024-08-06":
      case "gpt-4o-2024-05-13":
      case "gpt-4o-mini":
      case "gpt-4o-mini-2024-07-18":
      case "gpt-4-turbo":
      case "gpt-4-1106-preview":
      case "gpt-4-turbo-preview":
        return 128_000;
      case "gpt-4":
        return 8_192;
      case "gpt-4-32k":
        return 32_000;
      default:
        return 4_096; // assume a fine-tune 3.5?
    }
  }

  // Short circuit if name has 'gpt' since we now fetch models from OpenAI API
  // via the user API key, so the model must be relevant and real.
  // and if somehow it is not, chat will fail but that is caught.
  // we don't want to hit the OpenAI api every chat because it will get spammed
  // and introduce latency for no reason.
  async isValidChatCompletionModel(modelName = "") {
    const isPreset = modelName.toLowerCase().includes("gpt");
    if (isPreset) return true;

    const model = await this.openai.models
      .retrieve(modelName)
      .then((modelObj) => modelObj)
      .catch(() => null);
    return !!model;
  }

  /**
   * Generates appropriate content array for a message + attachments.
   * @param {{userPrompt:string, attachments: import("../../helpers").Attachment[]}}
   * @returns {string|object[]}
   */
  #generateContent({ userPrompt, attachments = [] }) {
    if (!attachments.length) {
      return userPrompt;
    }

    const content = [{ type: "text", text: userPrompt }];
    for (let attachment of attachments) {
      content.push({
        type: "image_url",
        image_url: {
          url: attachment.contentString,
          detail: "high",
        },
      });
    }
    return content.flat();
  }

  /**
   * Construct the user prompt for this model.
   * @param {{attachments: import("../../helpers").Attachment[]}} param0
   * @returns
   */
  constructPrompt({
    systemPrompt = "",
    contextTexts = [],
    chatHistory = [],
    userPrompt = "",
    attachments = [], // This is the specific attachment for only this prompt
  }) {
    const prompt = {
      role: "system",
      content: `${systemPrompt}${this.#appendContext(contextTexts)}`,
    };
    return [
      prompt,
      ...chatHistory,
      {
        role: "user",
        content: this.#generateContent({ userPrompt, attachments }),
      },
    ];
  }

  async getChatCompletion(messages = null, { temperature = 0.7 }) {
    if (!(await this.isValidChatCompletionModel(this.model)))
      throw new Error(
        `OpenAI chat: ${this.model} is not valid for chat completion!`
      );

    const result = await this.openai.chat.completions
      .create({
        model: this.model,
        messages,
        temperature,
      })
      .catch((e) => {
        throw new Error(e.message);
      });

    if (!result.hasOwnProperty("choices") || result.choices.length === 0)
      return null;
    return result.choices[0].message.content;
  }

  async streamGetChatCompletion(messages = null, { temperature = 0.7 }) {
    if (!(await this.isValidChatCompletionModel(this.model)))
      throw new Error(
        `OpenAI chat: ${this.model} is not valid for chat completion!`
      );

    const streamRequest = await this.openai.chat.completions.create({
      model: this.model,
      stream: true,
      messages,
      temperature,
    });
    return streamRequest;
  }

  handleStream(response, stream, responseProps) {
    return handleDefaultStreamResponseV2(response, stream, responseProps);
  }

  // Simple wrapper for dynamic embedder & normalize interface for all LLM implementations
  async embedTextInput(textInput) {
    return await this.embedder.embedTextInput(textInput);
  }
  async embedChunks(textChunks = []) {
    return await this.embedder.embedChunks(textChunks);
  }

  async compressMessages(promptArgs = {}, rawHistory = []) {
    const { messageArrayCompressor } = require("../../helpers/chat");
    const messageArray = this.constructPrompt(promptArgs);
    return await messageArrayCompressor(this, messageArray, rawHistory);
  }
}

module.exports = {
  OpenAiLLM,
};
