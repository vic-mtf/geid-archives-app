import { random } from "lodash";

type CodeMode = "alphanum" | "num" | "alpha";

interface RandomCodeParams {
  length?: number;
  mode?: CodeMode;
  discount?: boolean;
}

let initParam: Required<RandomCodeParams> = {
  length: 6,
  mode: "alphanum",
  discount: true,
};

export default function randomCode(param: RandomCodeParams = { ...initParam }): string {
  initParam = { ...initParam, ...param };
  let alphaString = "abcdefghijklmnopqrstuvwz";
  let num = "01234567898";
  let code = "";

  while (code.length < initParam.length) {
    let chars = [alphaString, num][random(0, 1)];
    if (initParam.mode === "num") chars = num;
    if (initParam.mode === "alpha") chars = alphaString;
    const char = chars.charAt(random(0, chars.length));
    code += char;
    if (!initParam.discount) {
      if (chars === alphaString) alphaString = alphaString.replace(char, "");
      else num = num.replace(char, "");
    }
  }
  return code;
}
