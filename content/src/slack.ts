import { getSelectedUserInfo, getUserList } from "./csv/cybozu_user_config";
import { getScheduleConfig } from "./csv/schedule";
import { getRemind, isSetSchedule } from "./csv/remind";
import { loadScheduleDetails } from "./csv/schedule_details";
import { getFormattedDate, getTimeAgo, unixTimestampToDate } from "./util";
import { createRemindKey } from "./util/remind";
import { accessoryOptionBlock, selectDate } from "./template";
import moment from "moment";
import { actionIds } from "./constants";
moment.locale("ja");

export const sendHomeTab = async (e: any, user: string) => {
  return e.client.views.publish({
    user_id: user,
    view: {
      type: "home",
      blocks: [
        ...createSelectClientCybozuConfig(user),
        {
          type: "divider",
        },
        ...createSchedule(user),
      ],
    },
  });
};

export const createSchedule = (slack_id: string) => {
  const cybozuConfig = getSelectedUserInfo(slack_id); // 現在選択してるユーザー情報
  let blocks: any[] = [];

  // ユーザー情報がない
  if (!cybozuConfig?.uid) {
    return [];
  }

  // 選択している日付
  const config = getScheduleConfig(slack_id);
  const selected_date = config.selected_date || getFormattedDate();
  const [year, month, date] = selected_date.split("-");
  // 日付の選択するブロック
  blocks.push(selectDate(selected_date, actionIds.selected_date));

  // リマインド情報
  const reminds = getRemind(slack_id);
  // 指定の日付のスケジュールをロード

  const schedules = loadScheduleDetails(cybozuConfig.uid, year, month, date);

  (schedules.data[date] || []).forEach((schedule: any, index: number) => {
    const remindKey = createRemindKey(
      cybozuConfig.uid,
      year,
      month,
      date,
      String(index)
    );

    const time =
      schedule.start || schedule.end
        ? `${schedule.start || ""}${schedule.end ? "~" + schedule.end : ""} `
        : "設定なし";
    const title = schedule.title || "タイトル";
    const remind = isSetSchedule(slack_id, remindKey)
      ? ` :hourglass_flowing_sand: ${moment(
          unixTimestampToDate(reminds[remindKey]["remind_at"])
        ).format("llll")}`
      : "";
    const optionValue = index + "-" + selected_date + "-" + cybozuConfig.uid;

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${schedule.type ? `*${schedule.type}:* ` : ""}*${title}* \n${
          schedule["memo"] || ""
        }`,
      },
      accessory: {
        type: "overflow",
        action_id: actionIds.setRemind,
        options: [
          accessoryOptionBlock("5分前リマインド", "5-" + optionValue),
          accessoryOptionBlock("15分前リマインド", "15-" + optionValue),
          accessoryOptionBlock("30分前リマインド", "30-" + optionValue),
          accessoryOptionBlock("リマインドを削除", "delete-" + optionValue),
        ],
      },
    });

    // イベント日時
    const accessory = {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: ":date: " + time,
        },
      ] as any[],
    };

    // メンバーと場所
    [
      ["member", ":busts_in_silhouette: "],
      ["institution", ":house_with_garden: "],
    ].forEach(([action, emoji]) => {
      if (schedule[action]) {
        accessory.elements.push({
          type: "mrkdwn",
          text: emoji + schedule[action],
        });
      }
    });

    if (0 < remind.length) {
      accessory.elements.push({
        type: "mrkdwn",
        text: remind,
      });
    }
    blocks.push(accessory);
    if (schedule.href) {
      blocks.push({
        type: "actions",
        elements: [
          {
            action_id: "click_none_1",
            type: "button",
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
            style: "primary",
            url: process.env.CYBOZU_URL2 + `${schedule.href}`,
            value: "approve",
          },
        ],
      });
    }

    blocks.push({
      type: "divider",
    });
  });

  // ファイルがない
  if (!schedules.update_at) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "データが登録されていません",
      },
    });
  }

  // スケジュールがない
  console.log("length:", blocks.length);

  if (blocks.length <= 1) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "スケジュールはありません",
      },
    });
  }

  // ファイルがある
  if (schedules.update_at) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "更新: " +
          getTimeAgo(schedules.update_at) +
          " [" +
          moment(schedules.update_at).format("llll") +
          "]",
      },
    });
  }
  // 更新ぼたん
  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "データ取得（反映まで数秒かかります）",
          emoji: true,
        },
        style: "danger",
        action_id: actionIds.loadCybozu,
        value:
          cybozuConfig.uid + "-" + (config.selected_date || getFormattedDate()),
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "リロード",
          emoji: true,
        },
        action_id: actionIds.reloadCybozu,
        style: "primary",
        value: "approve",
      },
    ],
  });
  return blocks;
};

export const createSelectClientCybozuConfig = (user: string) => {
  const { name, uid } = getSelectedUserInfo(user);
  const hosts = mapUsers("*");
  const menu: { [key: string]: any }[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          name || uid
            ? `*${name || "uid: " + uid}* のスケジュールを表示してます`
            : "使用するにはサイボウズユーザーを登録してください",
      },
      accessory: {
        type: "overflow",
        options: [
          accessoryOptionBlock(
            `サイボウズユーザーを登録`,
            actionIds.cybozu_config_edit.add
          ),
        ],
        action_id: actionIds.cybozu_config_edit.actionId,
      },
    },
  ];

  if (uid) {
    menu[0].accessory.options.push(
      accessoryOptionBlock(
        `:wastebasket:設定を削除 ${name || uid}`,
        actionIds.cybozu_config_edit.delete
      )
    );
    menu[0].accessory.options.push(
      accessoryOptionBlock(
        `:date: 日付指定を解除`,
        actionIds.cybozu_config_edit.deleteSelectDate
      )
    );
  }

  const temp: { [key: string]: any } = {
    type: "actions",
    elements: [
      {
        type: "static_select",
        placeholder: {
          type: "plain_text",
          emoji: true,
          text: "表示ユーザーを変更",
        },
        options: hosts,
        action_id: actionIds.changeSelectUser,
      },
    ],
  };

  if (hosts.length > 0) {
    menu.push(temp);
  }

  return menu;
};

// ドロップダウンリストのアイテム
const mapUsers = (user: string) => {
  const hosts = getUserList(user);
  let arr = Object.entries(hosts).map(([_, value]) => value);

  // Sort the array by the 'name' property
  arr.sort((a: any, b: any) => a?.name?.localeCompare(b?.name));
  return arr.map((value: any) => ({
    text: {
      type: "plain_text",
      emoji: true,
      text: value.name || value.uid,
    },
    value: value.uid,
  }));
};
