import { deleteSelectedDate } from "../csv/schedule";
import { deleteSelectCybozuUserInfo } from "../csv/cybozu_user_config";
import { addZabbixServerModal } from "../template";
import {
  AllMiddlewareArgs,
  BlockOverflowAction,
  SlackActionMiddlewareArgs,
} from "@slack/bolt";
import { StringIndexed } from "@slack/bolt/dist/types/helpers";
import { actionIds } from "../constants";

export const MenuAction: {
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
        callback_id: actionIds.submitCybozuConfig,
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
    deleteSelectCybozuUserInfo(e.body.user.id);
  },
};
