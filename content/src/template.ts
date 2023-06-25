import { Block, KnownBlock } from "@slack/bolt";

export const addZabbixServerModal = (
  uid: string = ""
): (Block | KnownBlock)[] => [
  {
    dispatch_action: false,
    type: "input",
    block_id: "cybozu_uid",
    element: {
      type: "plain_text_input",
      initial_value: uid,
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
];
