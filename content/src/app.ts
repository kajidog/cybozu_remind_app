import {
  AllMiddlewareArgs,
  App,
  Block,
  BlockButtonAction,
  BlockDatepickerAction,
  BlockOverflowAction,
  BlockStaticSelectAction,
  KnownBlock,
  LogLevel,
  SlackActionMiddlewareArgs,
} from "@slack/bolt";
import {
  deleteSelectHost,
  setSelectHost,
  setToken,
} from "./cybozu_user_config";
import { sendHomeTab } from "./slack";
import { addZabbixServerModal } from "./template";
import { StringIndexed } from "@slack/bolt/dist/types/helpers";
import {
  deleteSelectedDate,
  getScheduleConfig,
  loadSchedule,
  setScheduleConfig,
} from "./schedule";
import { getSchedules } from "./getSchedules";
import {
  createRemindKey,
  deleteRemind,
  getRemind,
  setAllRemind,
  setRemind,
} from "./remind";
import { getScheduleDetails } from "./getScheduleDetails";
console.log(process.env.SLACK_APP_TOKEN);

const app = new App({
  logLevel: LogLevel.INFO,
  socketMode: true,
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
});

// ホームタブを開くイベント
app.event("app_home_opened", async (e) => {
  const { event, logger } = e;
  try {
    const result = await sendHomeTab(e, event.user); //　ブロック送信
  } catch (error) {
    logger.error(error);
  }
});

app.action("click_none_1", async (e) => {
  e.ack();
});
app.action("click_none_2", async (e) => {
  e.ack();
});

app.action<BlockOverflowAction>("set_remind", async (e) => {
  e.ack();
  const [action, index, year, month, date, uid] =
    e.payload.selected_option.value.split("-");
  const { data } = loadSchedule(uid, year, month);

  const key = createRemindKey(uid, year, month, date, index);

  // リマインド削除
  if (action === "delete") {
    deleteRemind(e.body.user.id, key);
    sendHomeTab(e, e.body.user.id);
    return;
  }

  // リマインドカスタム設定

  // ここからはリマインド設定
  if (!data[date]?.[Number(index)]?.["start"]) {
    //return;
  }
  let saveData = getRemind(e.body.user.id);
  let target_data = data[date][Number(index)];
  const ogDate = new Date(`${year}/${month}/${date} ${target_data["start"]}`);

  if (isNaN(Number(action))) {
    return;
  }

  //const remindDate = new Date("2023/06/25 19:36");
  const remindDate = new Date(ogDate.getTime() - Number(action) * 60 * 1000);
  target_data["remind_at"] = Math.floor(remindDate.getTime() / 1000);
  saveData[key] = data[date][Number(index)];
  setRemind(e.body.user.id, saveData, key);
  sendHomeTab(e, e.body.user.id);
  return;
});

const MenuAction: {
  [key: string]: (
    e: SlackActionMiddlewareArgs<BlockOverflowAction> &
      AllMiddlewareArgs<StringIndexed>
  ) => void;
} = {
  cybozu_config_edit: (e) => {
    e.client.views.open({
      trigger_id: e.body["trigger_id"],
      view: {
        type: "modal",
        callback_id: "submit_cybozu_config_edit",
        title: { type: "plain_text", text: "設定編集" },
        submit: { type: "plain_text", text: "保存" },
        close: { type: "plain_text", text: "キャンセル" },
        blocks: addZabbixServerModal(),
      },
    });
    return;
  },
  delete_selected_date: (e) => {
    deleteSelectedDate(e.body.user.id);
  },
  delete_host: (e) => {
    deleteSelectHost(e.body.user.id);
  },
};

app.action<BlockOverflowAction>("menu_select", async (e) => {
  console.table(e.payload);
  MenuAction[e.payload.selected_option.value] &&
    MenuAction[e.payload.selected_option.value](e);
  sendHomeTab(e, e.body.user.id);
  e.ack();
});

app.action<BlockButtonAction>("load_cybozu", async (e) => {
  console.table(e.payload.value);
  const [uid, year, month, date] = e.payload.value.split("-");
  e.ack();
  await getScheduleDetails(year, month, date, uid);
  sendHomeTab(e, e.body.user.id);
});
app.action<BlockButtonAction>("reload_cybozu", async (e) => {
  sendHomeTab(e, e.body.user.id);
  e.ack();
});

app.action<BlockDatepickerAction>("set_selected_date", async (e) => {
  let { data } = getScheduleConfig(e.body.user.id);
  console.table(e.payload.selected_date);
  data = {
    ...data,
    selected_date: e.payload.selected_date,
  };
  setScheduleConfig(e.body.user.id, data);
  sendHomeTab(e, e.body.user.id);
  e.ack();
});

app.action<BlockStaticSelectAction>("select_zabbix_host", async (e) => {
  console.log("select");

  setSelectHost(e.body.user.id, e.payload.selected_option.value);
  sendHomeTab(e, e.body.user.id);
  e.ack();
});

(async () => {
  await app.start();
  setAllRemind();
  console.log("⚡️ Bolt app started");
})();

app.view("submit_cybozu_config_edit", async (e) => {
  const { cybozu_uid, friendly_name } = e.view.state.values;
  const user = e.body.user.id;
  const uid = extractNumbersFromString(cybozu_uid.cybozu_uid.value);
  const name = friendly_name.friendly_name.value;
  if (uid.length) {
    setSelectHost(user, uid);
    setToken(user, uid, { name, uid });
  }

  sendHomeTab(e, user);
  e.ack();
});

export async function sendMessageWithBlock(
  userId: string,
  blocks: (Block | KnownBlock)[],
  text: string
) {
  try {
    console.log(JSON.stringify(blocks));

    // ユーザーとのDMのチャンネルIDを取得する
    const { channel } = await app.client.conversations.open({
      users: userId,
    });

    const result = await app.client.chat.postMessage({
      channel: channel.id,
      blocks,
      text, // Block Kitが表示できない場合のテキスト
    });

    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

function extractNumbersFromString(str: string) {
  const regex = /[0-9]/g;
  const numbers = str.match(regex);

  if (numbers) {
    return numbers.join("");
  } else {
    return "";
  }
}
