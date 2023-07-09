import { table } from "console";
import { readJSONFile, writeJSONFile } from "./fs";

const TOKENS_FILENAME = "tokens.json";
const SELECT_HOSTS_FILENAME = "select_hosts.json";

// トークン取得
export const getToken = (slackID: string, key: string) => {
  const { data: tokens } = readJSONFile(TOKENS_FILENAME);

  if (!tokens["*"] || !tokens["*"]?.[key]) {
    return {};
  }
  return tokens[slackID]?.[key] || {};
};

// トークン保存
export const setToken = (key: string, host: string, saveData: any) => {
  let { data: tokens } = readJSONFile(TOKENS_FILENAME);

  tokens[key] = {
    ...tokens["*"],
    [host]: saveData,
  };
  writeJSONFile(TOKENS_FILENAME, tokens);

  return getToken(key, host);
};

// ユーザー名から選択しているZabbixのトークンを取得
export const getTokenByUser = (slack_id: string) => {
  return getToken("*", getSelectHost(slack_id));
};

// 設定したホストを取得
export const getHosts = (user: string) => {
  try {
    const { data: tokens } = readJSONFile(TOKENS_FILENAME);

    return tokens[user] || {};
  } catch (error) {
    return {};
  }
};

// 選択中のホストを取得
export const getSelectHost = (user: string) => {
  const { data: selectHosts } = readJSONFile(SELECT_HOSTS_FILENAME);
  return selectHosts[user];
};

// 選択するホストを設定
export const setSelectHost = (user: string, key: string) => {
  let { data: selectHosts } = readJSONFile(SELECT_HOSTS_FILENAME);
  selectHosts[user] = key;
  table(selectHosts);
  writeJSONFile(SELECT_HOSTS_FILENAME, selectHosts);
  return getSelectHost(user);
};

// 選択しているホストの設定を削除
export const deleteSelectHost = (user: string) => {
  let { data: tokens } = readJSONFile(TOKENS_FILENAME);
  let { data: selectHosts } = readJSONFile(SELECT_HOSTS_FILENAME);
  const selectHost = getSelectHost(user);
  delete selectHosts[user];
  delete tokens["*"]?.[selectHost];
  writeJSONFile(TOKENS_FILENAME, tokens);
  writeJSONFile(SELECT_HOSTS_FILENAME, selectHosts);
};
