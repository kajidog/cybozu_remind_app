import { getCybozuConfig } from "./cybozu_user_config";
import { getScheduleConfig, loadSchedule } from "./schedule";
import { getSchedules } from "./getSchedules";
import moment from "moment";
import { createRemindKey, getRemind, isSetSchedule } from "./remind";
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
  const cybozuConfig = getCybozuConfig(slack_id);
  if (!cybozuConfig?.uid) {
    return [];
  }
  let blocks: any[] = [];

  // 日付設定
  const config = getScheduleConfig(slack_id);
  console.table(config);

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "datepicker",
        initial_date: config.selected_date,
        action_id: "set_selected_date",
        placeholder: {
          type: "plain_text",
          text: "Select a date",
          emoji: true,
        },
      },
    ],
  });
  const [year, month, date] = (
    config.selected_date || getFormattedDate()
  ).split("-");

  // 指定の日付でスケジュールをロード
  const schedules = loadSchedule(cybozuConfig.uid, year, month);
  const reminds = getRemind(slack_id);
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
      ? `リマインド: ${moment(
          unixTimestampToDate(reminds[remindKey]["remind_at"])
        ).format("llll")}`
      : "";

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${schedule.type ? `*${schedule.type}:* ` : ""}*${title}*`,
      },
      accessory: {
        type: "overflow",
        action_id: "set_remind",
        options: [
          {
            text: {
              type: "plain_text",
              text: "5分前にリマインド",
              emoji: true,
            },
            value:
              "5-" +
              index +
              "-" +
              config.selected_date +
              "-" +
              cybozuConfig.uid,
          },
          {
            text: {
              type: "plain_text",
              text: "15分前にリマインド",
              emoji: true,
            },
            value:
              "15-" +
              index +
              "-" +
              config.selected_date +
              "-" +
              cybozuConfig.uid,
          },
          {
            text: {
              type: "plain_text",
              text: "30分前にリマインド",
              emoji: true,
            },
            value:
              "30-" +
              index +
              "-" +
              config.selected_date +
              "-" +
              cybozuConfig.uid,
          },
          // {
          //   text: {
          //     type: "plain_text",
          //     text: "指定時間にリマインド",
          //     emoji: true,
          //   },
          //   value:
          //     "select-" +
          //     index +
          //     "-" +
          //     config.selected_date +
          //     "-" +
          //     cybozuConfig.uid,
          // },
          {
            text: {
              type: "plain_text",
              text: "リマインドを削除",
              emoji: true,
            },
            value:
              "delete-" +
              index +
              "-" +
              config.selected_date +
              "-" +
              cybozuConfig.uid,
          },
        ],
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

  if (!schedules.update_at) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "データが登録されていません",
      },
    });
  }

  if (blocks.length <= 1) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "スケジュールはありません",
      },
    });
  }

  if (schedules.update_at) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "更新: " +
          getTimeAgo(schedules.update_at) +
          " - " +
          moment(schedules.update_at).format("llll"),
      },
    });
  }
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
        action_id: "load_cybozu",
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
        action_id: "reload_cybozu",
        style: "primary",
        value: "approve",
      },
    ],
  });
  return blocks;
};
export const createSelectClientCybozuConfig = (user: string) => {
  const cybozuConfig = getCybozuConfig(user);
  const menu: { [key: string]: any }[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: cybozuConfig
          ? `*サイボウズUID: ${cybozuConfig?.uid}*`
          : "使用するにはサイボウズのUIDを設定してください",
      },
      accessory: {
        type: "overflow",
        options: [
          {
            text: {
              type: "plain_text",
              text: "サイボウズUID設定",
              emoji: true,
            },
            value: "cybozu_config_edit",
          },
        ],
        action_id: "menu_select",
      },
    },
  ];

  return menu;
};

function getTimeAgo(date: Date): string {
  const now = new Date();
  const elapsedTime = now.getTime() - date.getTime(); // 経過時間（ミリ秒）

  const seconds = Math.floor(elapsedTime / 1000); // 経過時間（秒単位）
  const minutes = Math.floor(seconds / 60); // 経過時間（分単位）
  const hours = Math.floor(minutes / 60); // 経過時間（時間単位）
  const days = Math.floor(hours / 24); // 経過時間（日単位）

  if (days > 0) {
    return `${days}日前`;
  } else if (hours > 0) {
    return `${hours}時間前`;
  } else if (minutes > 0) {
    return `${minutes}分前`;
  } else {
    return `${seconds}秒前`;
  }
}

function getFormattedDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function unixTimestampToDate(unixTimestamp: number): Date {
  const milliseconds = unixTimestamp * 1000;
  return new Date(milliseconds);
}
