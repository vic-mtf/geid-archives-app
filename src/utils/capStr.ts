const capStr = (str: string): string | null =>
  typeof str === "string"
    ? str.charAt(0).toUpperCase() + str.slice(1)
    : null;

export default capStr;
