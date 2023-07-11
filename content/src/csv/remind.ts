import { Block, KnownBlock } from "@slack/bolt";
import { readJSONFile, writeJSONFile } from "../util/fs";
import { sendMessageWithBlock } from "../util";
import { saveFile } from "../constants";

export const setRemind = (slackId: string, saveData: any, addKey: string) => {
  console.log("remind add: ", addKey);
  const res = setSchedule(
    Number(saveData[addKey]["remind_at"]),
    () => {
      console.log("done-remind");
      console.table(saveData[addKey]);

      const { blocks, title } = createRemindBlocks(saveData[addKey]);

      sendMessageWithBlock(slackId, blocks, "リマインド: " + title);
    },
    slackId,
    addKey
  );

  if (res === -1) {
    deleteRemind(slackId, addKey);
    return;
  }
  let { data: reminds } = readJSONFile(saveFile.remind);

  reminds[slackId] = saveData;
  writeJSONFile(saveFile.remind, reminds);

  return;
};

export const getRemind = (slack_id: string) => {
  const { data: reminds } = readJSONFile(saveFile.remind);
  if (slack_id === "*") {
    return reminds;
  }
  if (!reminds[slack_id]) {
    return {};
  }
  return reminds[slack_id] || {};
};

export const deleteRemind = (slack_id: string, key: string) => {
  cancelSchedule(slack_id, key);
  let data = getRemind("*");
  delete data[slack_id]?.[key];
  writeJSONFile(saveFile.remind, data);
};

// タイマーIDを保存するためのMap
let timerMap: Map<string, NodeJS.Timeout> = new Map();

// スケジュール設定関数
function setSchedule(
  unixTime: number,
  callback: () => void,
  slack_id: string,
  id: string
) {
  const ID = slack_id + id;
  const currentTime = Math.floor(Date.now() / 1000); // 現在のUnixTimeを取得
  const delay = (unixTime - currentTime) * 1000; // 遅延時間をミリ秒で計算

  if (delay < 0) {
    console.log("The specified UnixTime has already passed");

    deleteRemind(slack_id, id);
    return -1;
  }

  if (isSetSchedule(slack_id, id)) {
    cancelSchedule(slack_id, id);
  }

  console.log("delay: ", ID, unixTime, delay);

  // スケジュールを設定し、タイマーIDをMapに保存
  const timerId = setTimeout(callback, delay);
  timerMap.set(ID, timerId);
  return 0;
}

// スケジュールキャンセル
function cancelSchedule(slackId: string, id: string): void {
  const ID = slackId + id;
  const timerId = timerMap.get(ID);
  if (timerId) {
    clearTimeout(timerId); // スケジュールをキャンセル
    timerMap.delete(ID); // Mapから該当のタイマーIDを削除
  } else {
    console.log(`No schedule found with id: ${ID}`);
  }
}

// リマインドが設定されているか確認
export const isSetSchedule = (slackId: string, key: string) => {
  return timerMap.get(slackId + key);
};

// 設定ファイルをもとにリマインドを設定
export const setAllRemind = () => {
  const reminds = getRemind("*");
  Object.keys(reminds).forEach((slackId) => {
    Object.keys(reminds[slackId]).forEach((id) => {
      setSchedule(
        Number(reminds[slackId][id]["remind_at"]),
        () => {
          const { blocks, title } = createRemindBlocks(reminds[slackId][id]);
          sendMessageWithBlock(slackId, blocks, "リマインド: " + title);
        },
        slackId,
        id
      );
    });
  });
};

const createRemindBlocks = (schedule: any) => {
  let blocks: (Block | KnownBlock)[] = [];

  const time =
    schedule.start || schedule.end
      ? `${schedule.start || ""} ~ ${schedule.end || ""} `
      : "設定なし";

  const title = schedule.title || "タイトル";
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*${schedule.type ? `${schedule.type}: ` : ""}${title}*`,
    },
  });
  const accessory = {
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "時間:" + time,
      },
    ] as any[],
  };
  blocks.push(accessory);

  if (schedule.href) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          action_id: "click_none_1",
          text: {
            type: "plain_text",
            text: "社外サイボウズ",
            emoji: true,
          },
          style: "primary",
          url: process.env.CYBOZU_URL1 + `${schedule.href}`,
        },
        {
          action_id: "click_none_2",
          type: "button",
          text: {
            type: "plain_text",
            text: "社内",
            emoji: true,
          },
          url: process.env.CYBOZU_URL2 + `${schedule.href}`,
          style: "primary",
          value: "approve",
        },
      ],
    });
  }
  return { blocks, title };
};
