import { table } from "console";
import { readJSONFile, writeJSONFile } from "../util/fs";
import { saveFile } from "../constants";

// サイボウズユーザー取得
export const getCybozuUser = (slackID: string, key: string) => {
  const { data: users } = readJSONFile(saveFile.cybozuConfig);

  if (!users[slackID] || !users[slackID]?.[key]) {
    return {};
  }
  return users[slackID]?.[key] || {};
};

// サイボウズユーザー設定
export const setCybozuUser = (key: string, uid: string, saveData: any) => {
  let { data: tokens } = readJSONFile(saveFile.cybozuConfig);

  tokens[key] = {
    ...tokens["*"],
    [uid]: saveData,
  };

  writeJSONFile(saveFile.cybozuConfig, tokens);

  return getCybozuUser(key, uid);
};

// 現在選択しているサイボウズユーザーを取得
export const getSelectedUserInfo = (slack_id: string) => {
  return getCybozuUser("*", getSelectedUid(slack_id));
};

// 設定したuidを取得
export const getUserList = (slackID: string) => {
  try {
    const { data } = readJSONFile(saveFile.cybozuConfig);

    return data[slackID] || {};
  } catch (error) {
    return {};
  }
};

// 選択中のuidを取得
export const getSelectedUid = (slackID: string) => {
  const { data } = readJSONFile(saveFile.selectedUser);
  return data[slackID];
};

// 選択するホストを設定
export const setSelectHost = (user: string, key: string) => {
  let { data: selectHosts } = readJSONFile(saveFile.selectedUser);
  selectHosts[user] = key;
  table(selectHosts);
  writeJSONFile(saveFile.selectedUser, selectHosts);
  return getSelectedUid(user);
};

// 選択しているユーザーの設定を削除
export const deleteSelectCybozuUserInfo = (user: string) => {
  let { data: tokens } = readJSONFile(saveFile.cybozuConfig);
  let { data: selectHosts } = readJSONFile(saveFile.selectedUser);
  const selectHost = getSelectedUid(user);
  delete selectHosts[user];
  delete tokens["*"]?.[selectHost];
  writeJSONFile(saveFile.cybozuConfig, tokens);
  writeJSONFile(saveFile.selectedUser, selectHosts);
};
