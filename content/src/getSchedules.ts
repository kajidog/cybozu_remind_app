const { chromium } = require("playwright");
import moment from "moment";
import { writeJSONFile } from "./fs";

const SAVE_FILENAME = "event.json";

moment.locale("ja");
export const getSchedules = async (
  year: string,
  month: string,
  day: string,
  uid: string
) => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    httpCredentials: {
      username: process.env.BASIC_USER,
      password: process.env.BASIC_PASS,
    },
  });

  // Add credentials for Basic auth
  const page = await context.newPage();
  const navigationPromise = page.waitForNavigation();

  // ログイン処理
  await page.goto(
    process.env.CYBOZU_URL1 +
      "ag.cgi?Page=&Group=1915&Submit=%E5%88%87%E3%82%8A%E6%9B%BF%E3%81%88%E3%82%8B"
  );

  // ユーザー選択
  await page.selectOption(
    "table > tbody > tr:nth-child(5) > td > .vr_loginForm",
    process.env.CYBOZU_UID
  );

  // パスワード入力
  await page.type(
    "table > tbody > tr:nth-child(8) > td > .vr_loginForm",
    process.env.CYBOZU_PASS
  );

  // ログインボタンクリック
  await page.click("table > tbody > tr > td > .vr_hotButton");
  await navigationPromise;

  const url =
    process.env.CYBOZU_URL1 +
    `ag.cgi?page=ScheduleUserMonth&UID=${uid}&CP=&sp=#date=da.${year}.${month}.${day}`;
  console.log(url);
  let saveData: any = {};
  // スケジュール取得
  await page.goto(url);

  await navigationPromise;

  const calender = await page.$$(".eventcell");

  for (const one_day of calender) {
    let date_str = String(year) + "/";
    const date = await one_day.$$(".date");
    let key = "";
    let save_month = "";
    let save_date = "";
    for (const childElement of date) {
      const date_str = await childElement.innerText();
      const [month, date] = date_str.split("/");
      save_month = month.padStart(2, "0");
      save_date = date.padStart(2, "0");
      key = `${year}/${save_month}`;
    }
    console.log(key + "/" + save_date);
    // if (key !== year + "/" + month) {
    //   console.log("skip", key + "/" + save_date, year + "/" + month);
    //   continue;
    // }
    const elements = await one_day.$$(".eventLink");

    // イベント
    if (!saveData[key]) {
      saveData[key] = {};
    }
    if (!saveData[key][save_date]) {
      saveData[key][save_date] = [];
    }
    for (const element of elements) {
      let eventData: any = {};
      const childElements = await element.$$(".scheduleEventMenu"); // Replace 'your-selector' with the actual selector

      // タグ名
      for (const childElement of childElements) {
        eventData["type"] = await childElement.innerText();
      }

      // 時間
      const timeElements = await element.$$(".eventDateTime"); // Replace 'your-selector' with the actual selector
      for (const childElement of timeElements) {
        const time_str = await childElement.innerText();

        const [start, end] = time_str.split("-");
        eventData["start"] = start;
        eventData["end"] = end?.trim();
        const date_start = moment(
          new Date(key + "/" + save_date + " " + start)
        ).format("LLLL");
        const date_end = moment(
          new Date(key + "/" + save_date + " " + end)
        ).format("LLLL");

        console.log(date_start, " ~ ", date_end);
      }

      // 詳細
      const eventDetails = await element.$$("a.event");
      for (const iterator of eventDetails) {
        const title = (await iterator.innerText()).replace(
          eventData["type"],
          ""
        );

        const href = await iterator.evaluate((element: any) => {
          return element.getAttribute("href");
        });

        href && (eventData["href"] = href);
        eventData["title"] = title || "";
      }
      saveData[key][save_date].push(eventData);
    }
    console.log("---------------------");
  }
  for (const key of Object.keys(saveData)) {
    console.log(key);
    writeJSONFile(
      uid + "-" + key.replace("/", "-") + "-" + SAVE_FILENAME,
      saveData[key]
    );
    console.table(saveData[key]);
  }

  await context.close();
  await browser.close();
};
