import {
  App,
  BlockButtonAction,
  BlockDatepickerAction,
  BlockOverflowAction,
  BlockStaticSelectAction,
  LogLevel,
} from "@slack/bolt";
import { setSelectHost, setCybozuUser } from "./csv/cybozu_user_config";
import { sendHomeTab } from "./slack";
import {
  getScheduleConfig,
  loadSchedule,
  setScheduleConfig,
} from "./csv/schedule";
import { deleteRemind, getRemind, setAllRemind, setRemind } from "./csv/remind";
import { getScheduleDetails } from "./playwrightAction//getScheduleDetails";
import { extractNumbersFromString } from "./util";
import { MenuAction } from "./util/menu";
import { createRemindKey } from "./util/remind";
import { actionIds } from "./constants";

export const app = new App({
  logLevel: LogLevel.INFO,
  socketMode: true,
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
});

// ホームタブを開くイベント
app.event("app_home_opened", async (e) => {
  const { event } = e;
  await sendHomeTab(e, event.user); //　ブロック送信
});

// リマインド設定
app.action<BlockOverflowAction>(actionIds.setRemind, async (e) => {
  e.ack();
  const [action, index, year, month, date, uid] =
    e.payload.selected_option.value.split("-");

  const key = createRemindKey(uid, year, month, date, index);

  // リマインド削除
  if (action === "delete") {
    deleteRemind(e.body.user.id, key);
    sendHomeTab(e, e.body.user.id);
    return;
  }

  // リマインドカスタム設定

  // ここからはリマインド設定
  const { data } = loadSchedule(uid, year, month);

  // 開始時間が設定されていない
  if (!data[date]?.[Number(index)]?.["start"]) {
    return;
  }
  // 指定のアクションではない
  if (isNaN(Number(action))) {
    return;
  }

  let target_data = data[date][Number(index)]; // 送信するデータ
  const ogDate = new Date(`${year}/${month}/${date} ${target_data["start"]}`); // リマインドしたいイベントの日時
  const remindDate = new Date(ogDate.getTime() - Number(action) * 60 * 1000); // リマインドしたいイベントの指定分前の日時
  target_data["remind_at"] = Math.floor(remindDate.getTime() / 1000); // UNIX TIMEへ変換

  // 保存時にリマインドは設定
  let saveData = getRemind(e.body.user.id);
  saveData[key] = data[date][Number(index)];
  setRemind(e.body.user.id, saveData, key);

  sendHomeTab(e, e.body.user.id);
  return;
});

// メニューイベント
app.action<BlockOverflowAction>(
  actionIds.cybozu_config_edit.actionId,
  async (e) => {
    MenuAction[e.payload.selected_option.value] &&
      MenuAction[e.payload.selected_option.value](e);
    sendHomeTab(e, e.body.user.id);
    e.ack();
  }
);

// サイボウズの情報を取得
app.action<BlockButtonAction>(actionIds.loadCybozu, async (e) => {
  console.table(e.payload.value);
  const [uid, year, month, date] = e.payload.value.split("-");
  e.ack();
  await getScheduleDetails(year, month, date, uid);
  sendHomeTab(e, e.body.user.id);
});

// ページ再読み込み
app.action<BlockButtonAction>(actionIds.reloadCybozu, async (e) => {
  sendHomeTab(e, e.body.user.id);
  e.ack();
});

// 表示する日付の切り替え
app.action<BlockDatepickerAction>(actionIds.selected_date, async (e) => {
  const { data } = getScheduleConfig(e.body.user.id);
  const saveData = {
    ...data,
    selected_date: e.payload.selected_date,
  };
  setScheduleConfig(e.body.user.id, saveData);
  sendHomeTab(e, e.body.user.id);
  e.ack();
});

// 表示するサイボウズユーザー切り替え
app.action<BlockStaticSelectAction>(actionIds.changeSelectUser, async (e) => {
  setSelectHost(e.body.user.id, e.payload.selected_option.value);
  sendHomeTab(e, e.body.user.id);
  e.ack();
});

// サイボウズユーザー追加
app.view(actionIds.submitCybozuConfig, async (e) => {
  const { cybozu_uid, friendly_name } = e.view.state.values;
  const user = e.body.user.id;
  const uid = extractNumbersFromString(cybozu_uid.cybozu_uid.value);
  const name = friendly_name.friendly_name.value;
  if (uid.length) {
    setSelectHost(user, uid);
    setCybozuUser("*", uid, { name, uid });
  }
  sendHomeTab(e, user);
  e.ack();
});

// URLクリック時のイベント
app.action("click_none_1", async (e) => {
  e.ack();
});
app.action("click_none_2", async (e) => {
  e.ack();
});

(async () => {
  await app.start();
  setAllRemind();
  console.log("⚡️ Bolt app started");
})();
