interface NormaliseParams {
  unit?: number;
  showMainUnit?: boolean;
  pad?: number;
}

interface NormaliseSizeObject extends NormaliseParams {
  size: number;
}

let initParams: Required<NormaliseParams> = {
  unit: 1000,
  showMainUnit: true,
  pad: 2,
};

export default function normaliseOctetSize(
  sizeData: number | NormaliseSizeObject,
  params: NormaliseParams = { ...initParams }
): string {
  initParams = { ...initParams, ...params };
  const resolved =
    typeof sizeData === "object"
      ? { ...initParams, ...sizeData }
      : { ...initParams, ...params, size: sizeData };

  const { size, unit, showMainUnit, pad } = resolved;
  const units = ["o", "Ko", "Mo", "Go", "To", "Po", "Eo", "Zo", "Yo"];
  let selectedVal = 0;
  let selectedMainUnit = units[0];

  for (let i = 0; i < units.length; i++) {
    if (size < Math.pow(unit, i + 1)) {
      selectedMainUnit = units[i];
      selectedVal = size / Math.pow(unit, i);
      break;
    }
  }

  const parts = String(selectedVal).split(".");
  return (
    parts[0] +
    (parts[1]
      ? "." +
        String(
          Math.round(
            parseFloat(
              parts[1].slice(0, 2) + "." + parts[1].slice(2).padEnd(1, "0")
            )
          )
        ).padEnd(pad, "0")
      : "") +
    (showMainUnit ? selectedMainUnit : "")
  );
}
