import { Block, KnownBlock } from "@slack/bolt";
import { app } from "../app";

export function extractNumbersFromString(str: string) {
  const regex = /[0-9]/g;
  const numbers = str.match(regex);

  if (numbers) {
    return numbers.join("");
  } else {
    return "";
  }
}

// DMへメッセージを送信
export async function sendMessageWithBlock(
  userId: string,
  blocks: (Block | KnownBlock)[],
  text: string
) {
  try {
    // ユーザーとのDMのチャンネルIDを取得
    const { channel } = await app.client.conversations.open({
      users: userId,
    });

    const result = await app.client.chat.postMessage({
      channel: channel.id,
      blocks,
      text,
    });

    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const elapsedTime = now.getTime() - date.getTime(); // 経過時間（ミリ秒）

  const seconds = Math.floor(elapsedTime / 1000); // 経過時間（秒単位）
  const minutes = Math.floor(seconds / 60); // 経過時間（分単位）
  const hours = Math.floor(minutes / 60); // 経過時間（時間単位）
  const days = Math.floor(hours / 24); // 経過時間（日単位）

  if (days > 0) {
    return `${days}日前 :warning: `;
  } else if (hours > 0) {
    return `${hours}時間前`;
  } else if (minutes > 0) {
    return `${minutes}分前`;
  } else {
    return `${seconds}秒前 :white_check_mark: `;
  }
}

export function getFormattedDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function unixTimestampToDate(unixTimestamp: number): Date {
  const milliseconds = unixTimestamp * 1000;
  return new Date(milliseconds);
}
