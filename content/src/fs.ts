import fs from "fs";

// JSONファイルを読み込む関数
export function readJSONFile(filepath: string) {
  try {
    const fileStats = fs.statSync("data/" + filepath);
    const fileData = fs.readFileSync("data/" + filepath, "utf8");
    const jsonData = JSON.parse(fileData);

    return {
      stats: fileStats,
      data: jsonData,
    };
  } catch (err) {
    console.error(err);
    return {
      stats: null,
      data: {},
    };
  }
}
export function writeJSONFile(filepath: string, obj: any) {
  try {
    fs.writeFileSync("data/" + filepath, JSON.stringify(obj, null, 2), "utf8");
    console.log(`Successfully saved changes to ${filepath}`);
  } catch (err) {
    console.log("write_error");
    console.error(err);
  }
}
