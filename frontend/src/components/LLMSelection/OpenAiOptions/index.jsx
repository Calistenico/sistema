import { useState, useEffect } from "react";
import System from "@/models/system";

export default function OpenAiOptions({
  settings,
  inputBgClassName = "bg-theme-bg-input-dark",
}) {
  const [inputValue, setInputValue] = useState(settings?.OpenAiKey);
  const [openAIKey, setOpenAIKey] = useState(settings?.OpenAiKey);

  return (
    <div className="flex gap-[36px] mt-1.5">
      <div className="flex flex-col w-60">
        <label className="text-white text-sm font-semibold block mb-3">
          API Key
        </label>
        <input
          type="password"
          name="OpenAiKey"
          className={`border-none ${inputBgClassName} text-theme-text-primary placeholder:text-theme-text-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5`}
          placeholder="OpenAI API Key"
          defaultValue={settings?.OpenAiKey ? "*".repeat(20) : ""}
          required={true}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => setOpenAIKey(inputValue)}
        />
      </div>
      {!settings?.credentialsOnly && (
        <OpenAIModelSelection
          settings={settings}
          apiKey={openAIKey}
          inputBgClassName={inputBgClassName}
        />
      )}
    </div>
  );
}

function OpenAIModelSelection({
  apiKey,
  settings,
  inputBgClassName = "bg-theme-bg-input-dark",
}) {
  const [groupedModels, setGroupedModels] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function findCustomModels() {
      setLoading(true);
      const { models } = await System.customModels(
        "openai",
        typeof apiKey === "boolean" ? null : apiKey
      );

      if (models?.length > 0) {
        const modelsByOrganization = models.reduce((acc, model) => {
          acc[model.organization] = acc[model.organization] || [];
          acc[model.organization].push(model);
          return acc;
        }, {});
        setGroupedModels(modelsByOrganization);
      }

      setLoading(false);
    }
    findCustomModels();
  }, [apiKey]);

  if (loading) {
    return (
      <div className="flex flex-col w-60">
        <label className="text-white text-sm font-semibold block mb-3">
          Chat Model Selection
        </label>
        <select
          name="OpenAiModelPref"
          disabled={true}
          className={`border-none ${inputBgClassName} text-theme-text-primary placeholder:text-theme-text-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5`}
        >
          <option disabled={true} selected={true}>
            -- loading available models --
          </option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-60">
      <label className="text-white text-sm font-semibold block mb-3">
        Chat Model Selection
      </label>
      <select
        name="OpenAiModelPref"
        required={true}
        className={`border-none ${inputBgClassName} text-theme-text-primary placeholder:text-theme-text-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5`}
      >
        {Object.keys(groupedModels)
          .sort()
          .map((organization) => (
            <optgroup key={organization} label={organization}>
              {groupedModels[organization].map((model) => (
                <option
                  key={model.id}
                  value={model.id}
                  selected={settings?.OpenAiModelPref === model.id}
                >
                  {model.name}
                </option>
              ))}
            </optgroup>
          ))}
      </select>
    </div>
  );
}
