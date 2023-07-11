import { Block, KnownBlock } from "@slack/bolt";
import { actionIds } from "./constants";

export const addZabbixServerModal = (): (Block | KnownBlock)[] => [
  {
    dispatch_action: false,
    type: "input",
    block_id: actionIds.addZabbixServerModal.uid.blockId,
    element: {
      type: "plain_text_input",
      placeholder: {
        type: "plain_text",
        text: "2743",
        emoji: true,
      },
      action_id: actionIds.addZabbixServerModal.uid.actionId,
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
    block_id: actionIds.addZabbixServerModal.friendName.blockId,
    element: {
      type: "plain_text_input",
      placeholder: {
        type: "plain_text",
        text: "表示名",
        emoji: true,
      },
      action_id: actionIds.addZabbixServerModal.friendName.actionId,
    },
    label: {
      type: "plain_text",
      text: "サイボウズ表示名",
      emoji: true,
    },
    optional: true,
  },
];

export const selectDate = (initData: string, actionId: string) => ({
  type: "actions",
  elements: [
    {
      type: "datepicker",
      initial_date: initData,
      action_id: actionId,
      placeholder: {
        type: "plain_text",
        text: "Select a date",
        emoji: true,
      },
    },
  ],
});

export const accessoryOptionBlock = (text: string, value: string) => ({
  text: {
    type: "plain_text",
    text,
    emoji: true,
  },
  value,
});
