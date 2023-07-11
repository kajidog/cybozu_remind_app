export const saveFile = {
  cybozuConfig: "cybozuInfo.json",
  scheduleDetails: "event_details.json",
  schedules: "event.json",
  selectedUser: "selected_uid.json",
  selectedDate: "schedule.json",
  remind: "remind.json",
} as const;

export const actionIds = {
  addZabbixServerModal: {
    uid: {
      blockId: "cybozu_uid",
      actionId: "cybozu_uid",
    },
    friendName: {
      blockId: "friendly_name",
      actionId: "friendly_name",
    },
  },
  selected_date: "set_selected_date",
  setRemind: "set_remind",
  loadCybozu: "load_cybozu",
  reloadCybozu: "reload_cybozu",
  cybozu_config_edit: {
    actionId: "menu_select",
    add: "cybozu_config_edit",
    delete: "delete_user",
    deleteSelectDate: "delete_selected_date",
  },
  submitCybozuConfig: "submit_cybozu_config_edit",
  changeSelectUser: "change_selected_user",
} as const;
