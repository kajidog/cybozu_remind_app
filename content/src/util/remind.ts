export const createRemindKey = (
  cybozuUid: string,
  year: string,
  month: string,
  date: string,
  index: string
) => {
  return `${index}-${year}-${month}-${date}-${cybozuUid}`;
};
