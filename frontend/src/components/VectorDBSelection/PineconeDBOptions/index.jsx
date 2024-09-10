import { useTranslation } from "react-i18next";

export default function PineconeDBOptions({ settings }) {
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col gap-y-7">
      <div className="w-full flex items-center gap-[36px] mt-1.5">
        <div className="flex flex-col w-60">
          <label className="text-white text-sm font-semibold block mb-3">
            {t("vector.pineconeDBOptions.apiKeyLabel")}
          </label>
          <input
            type="password"
            name="PineConeKey"
            className="bg-zinc-900 text-white placeholder:text-white/20 text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
            placeholder={t("vector.pineconeDBOptions.apiKeyPlaceholder")}
            defaultValue={settings?.PineConeKey ? "*".repeat(20) : ""}
            required={true}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-col w-60">
          <label className="text-white text-sm font-semibold block mb-3">
            {t("vector.pineconeDBOptions.indexNameLabel")}
          </label>
          <input
            type="text"
            name="PineConeIndex"
            className="bg-zinc-900 text-white placeholder:text-white/20 text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
            placeholder={t("vector.pineconeDBOptions.indexNamePlaceholder")}
            defaultValue={settings?.PineConeIndex}
            required={true}
            autoComplete="new-password"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
