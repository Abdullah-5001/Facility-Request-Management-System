import { useEffect } from "react";

const APP_NAME = "FRMS";

export function usePageTitle(title) {
  useEffect(() => {
    if (!title) {
      document.title = APP_NAME;
      return;
    }
    document.title = `${title} | ${APP_NAME}`;
  }, [title]);
}
