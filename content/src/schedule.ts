import { readJSONFile, writeJSONFile } from "./fs";

const CONFIG_FILENAME = "schedule.json";
const SCHEDULE_FILENAME = "event.json";

export const getScheduleConfig = (cybozuUid: string) => {
  const schedules = readJSONFile(CONFIG_FILENAME);
  if (!schedules.data[cybozuUid]) {
    return {};
  }
  return schedules.data[cybozuUid] || {};
};

export const setScheduleConfig = (cybozuUid: string, data: any) => {
  let tokens = readJSONFile(CONFIG_FILENAME);

  tokens.data[cybozuUid] = data;
  writeJSONFile(CONFIG_FILENAME, tokens.data);

  return getScheduleConfig(cybozuUid);
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
