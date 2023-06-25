import { readJSONFile, writeJSONFile } from "./fs";

const TOKENS_FILENAME = "cybozuInfo.json";

// サイボウズ設定情報取得
export const getCybozuConfig = (slack_id: string) => {
  const { data: tokens } = readJSONFile(TOKENS_FILENAME);

  if (!tokens[slack_id]) {
    return null;
  }

  return tokens[slack_id];
};

// サイボウズ設定情報保存
export const setCybozuConfig = (slackId: string, saveData: any) => {
  let { data: tokens } = readJSONFile(TOKENS_FILENAME);

  tokens[slackId] = saveData;
  writeJSONFile(TOKENS_FILENAME, tokens);

  return getCybozuConfig(slackId);
};
