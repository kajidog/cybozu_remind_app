import { saveFile } from "../constants";
import { readJSONFile } from "../util/fs";
import { loadSchedule } from "./schedule";

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

  // 詳細が取得されていない場合
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
  return `${cybozuUid}-${year}-${month}-${date}-` + saveFile.scheduleDetails;
};
