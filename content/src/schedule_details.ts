import { readJSONFile } from "./fs";
import { loadSchedule } from "./schedule";

const SCHEDULE_FILENAME = "event_details.json";

export const loadScheduleDetails = (
  cybozuUid: string,
  year: string,
  month: string,
  date: string
) => {
  let { data, stats } = readJSONFile(
    getScheduleFileName(cybozuUid, year, month, date)
  );
  let update_at = stats?.mtime;

  if (!Array.isArray(data)) {
    const no = loadSchedule(cybozuUid, year, month);
    data = no.data;
    update_at = no.update_at;
  }
  Array.isArray(data) && (data = { [date]: data });
  return {
    data,
    update_at,
  };
};

const getScheduleFileName = (
  cybozuUid: string,
  year: string,
  month: string,
  date: string
) => {
  return `${cybozuUid}-${year}-${month}-${date}-` + SCHEDULE_FILENAME;
};
