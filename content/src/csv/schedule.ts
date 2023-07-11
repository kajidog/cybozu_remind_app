import { saveFile } from "../constants";
import { readJSONFile, writeJSONFile } from "../util/fs";

const CONFIG_FILENAME = saveFile.selectedDate;
const SCHEDULE_FILENAME = saveFile.schedules;

export const getScheduleConfig = (slackId: string) => {
  const schedules = readJSONFile(CONFIG_FILENAME);
  if (!schedules.data[slackId]) {
    return {};
  }
  return schedules.data[slackId] || {};
};

export const setScheduleConfig = (slackId: string, data: any) => {
  let tokens = readJSONFile(CONFIG_FILENAME);

  tokens.data[slackId] = data;
  writeJSONFile(CONFIG_FILENAME, tokens.data);

  return getScheduleConfig(slackId);
};

export const deleteSelectedDate = (slackId: string) => {
  let tokens = readJSONFile(CONFIG_FILENAME);

  if (tokens.data[slackId]?.["selected_date"]) {
    delete tokens.data[slackId]["selected_date"];
  }
  writeJSONFile(CONFIG_FILENAME, tokens.data);
};
export const loadSchedule = (
  cybozuUid: string,
  year: string,
  month: string
) => {
  const { data, stats } = readJSONFile(
    getScheduleFileName(cybozuUid, year, month)
  );
  return {
    data,
    update_at: stats?.mtime,
  };
};

const getScheduleFileName = (
  cybozuUid: string,
  year: string,
  month: string
) => {
  return `${cybozuUid}-${year}-${month}-` + SCHEDULE_FILENAME;
};
