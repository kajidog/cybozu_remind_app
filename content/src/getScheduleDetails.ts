import { BrowserContext, Page, chromium } from "playwright";
import { writeJSONFile } from "./fs";
import { getSchedules } from "./getSchedules";

const SAVE_FILENAME = "event_details.json";

export const getScheduleDetails = async (
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

  const url =
    process.env.CYBOZU_URL1 +
    `ag.cgi?page=ScheduleUserMonth&UID=${uid}&CP=&sp=#date=da.${year}.${month}.${day}`;

  await page.goto(url);

  let saveData = await page.evaluate(
    ([targetDate]) => {
      let returnValue: any[] = [];
      const cells = Array.from(document.querySelectorAll(".eventcell"));
      const cell = cells.find((cell) => {
        let cellDate = cell.querySelector("span.date").textContent.trim();
        return cellDate === targetDate;
      });
      if (cell) {
        const date_str = cell.querySelector(".date")?.textContent;
        const [_, date] = date_str.split("/");

        Array.from(cell.querySelectorAll(".eventLink")).forEach((element) => {
          let eventData: any = {};
          const eventTime =
            element.querySelector(".eventDateTime")?.textContent || "";
          const [start, end] = eventTime.split("-");
          eventData["start"] = start;
          eventData["end"] = end?.trim();
          const eventDetails = element.querySelector("a.event");
          eventData["title"] = eventDetails?.textContent || "";
          const href = eventDetails.getAttribute("href");
          href && (eventData["href"] = href);
          returnValue.push(eventData);
        });
      }

      return returnValue;
    },
    [Number(month) + "/" + Number(day)]
  );

  for (const key in saveData) {
    if (saveData[key]["href"]) {
      const details = await getDetails(saveData[key]["href"], page);
      saveData[key] = {
        ...saveData[key],
        ...details,
      };
    }
  }

  const fileDate =
    year + "-" + month.padStart(2, "0") + "-" + day.padStart(2, "0");

  writeJSONFile(uid + "-" + fileDate + "-" + SAVE_FILENAME, saveData);

  getSchedules(year, month, day, uid, context).finally(() => {
    context.close();
    browser.close();
  });
};

const getDetails = async (href: string, page: Page) => {
  await page.goto(process.env.CYBOZU_URL1 + href);
  const details = await page.evaluate(() => {
    const menu = {
      施設: "institution",
      メモ: "memo",
      参加者: (trElement: Element) => {
        const members = Array.from(
          trElement.querySelectorAll("tr .inlineblockNobr")
        ).map((element) => {
          return element?.textContent;
        });
        let value = "";
        members.forEach((m, i) => (value += (i ? ", " : "") + m));
        return { key: "member", value };
      },
    } as any;
    let returnValue: any = {
      log: [],
    };
    Array.from(document.querySelectorAll("table.scheduleDataView tr")).forEach(
      (trElement) => {
        const type = (trElement.querySelector("th")?.textContent || "").replace(
          /（.*?）/g,
          ""
        );
        const action = menu[type];
        if (typeof action === "string") {
          returnValue[action] = trElement
            .querySelector("td")
            ?.textContent.replace(/<!--\/\/.*?\/\/-->/gs, "")
            .trim();
        }
        if (typeof action === "function") {
          const { key, value } = action(trElement);
          returnValue[key] = value;
        }
      }
    );

    return returnValue;
  });
  return details;
};
