import React from "react";
import { useTranslation } from "react-i18next"; // Import i18n hook

export default function VoyageAiOptions({ settings }) {
  const { t } = useTranslation(); // Initialize translation hook

  return (
    <div className="w-full flex flex-col gap-y-4">
      <div className="w-full flex items-center gap-[36px] mt-1.5">
        <div className="flex flex-col w-60">
          <label className="text-white text-sm font-semibold block mb-3">
            {t("embedding.voyageAiOptions.apiKeyLabel")}
          </label>
          <input
            type="password"
            name="VoyageAiApiKey"
            className="bg-zinc-900 text-white placeholder:text-white/20 text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
            placeholder={t("embedding.voyageAiOptions.apiKeyPlaceholder")}
            defaultValue={settings?.VoyageAiApiKey ? "*".repeat(20) : ""}
            required={true}
            autoComplete="new-password"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-col w-60">
          <label className="text-white text-sm font-semibold block mb-3">
            {t("embedding.voyageAiOptions.modelPrefLabel")}
          </label>
          <select
            name="EmbeddingModelPref"
            required={true}
            defaultValue={settings?.EmbeddingModelPref}
            className="bg-zinc-900 border-gray-500 text-white text-sm rounded-lg block w-full p-2.5"
          >
            <optgroup label={t("embedding.voyageAiOptions.modelOptGroupLabel")}>
              {[
                "voyage-large-2-instruct",
                "voyage-law-2",
                "voyage-code-2",
                "voyage-large-2",
                "voyage-2",
              ].map((model) => {
                return (
                  <option key={model} value={model}>
                    {model}
                  </option>
                );
              })}
            </optgroup>
          </select>
        </div>
      </div>
    </div>
  );
}
