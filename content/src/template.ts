import { Block, KnownBlock } from "@slack/bolt";

export const addZabbixServerModal = (): (Block | KnownBlock)[] => [
  {
    dispatch_action: false,
    type: "input",
    block_id: "cybozu_uid",
    element: {
      type: "plain_text_input",
      placeholder: {
        type: "plain_text",
        text: "2743",
        emoji: true,
      },
      action_id: "cybozu_uid",
    },
    label: {
      type: "plain_text",
      text: "サイボウズのUID",
      emoji: true,
    },
  },
  {
    dispatch_action: false,
    type: "input",
    block_id: "friendly_name",
    element: {
      type: "plain_text_input",
      placeholder: {
        type: "plain_text",
        text: "表示名",
        emoji: true,
      },
      action_id: "friendly_name",
    },
    label: {
      type: "plain_text",
      text: "サイボウズ表示名",
      emoji: true,
    },
    optional: true,
  },
];
