import { createContext, useContext } from "react";

export const COLOR_MODE_STORAGE_KEY = "frms_color_mode";

export const BRAND_GREEN = "#006838";
export const BRAND_RED = "#ED1C24";

export const ColorModeContext = createContext({
  mode: "light",
  toggleColorMode: () => {},
  setMode: () => {},
});

export function useColorMode() {
  return useContext(ColorModeContext);
}
