/**
 * The existing report-page flag, unchanged in behaviour: a sessionStorage marker read by /reports.
 * It is NOT access control (the document links are public in the page code); the reports-access
 * decision is pending and handled separately. Call only after the server confirmed acceptance.
 */
export const DOC_ACCESS_KEY = "kh_doc_access";

export function grantDocAccess(): void {
  try {
    sessionStorage.setItem(DOC_ACCESS_KEY, "true");
  } catch {
    /* storage unavailable (private mode or blocked): the page simply stays in its locked view */
  }
}

export function hasDocAccess(): boolean {
  try {
    return sessionStorage.getItem(DOC_ACCESS_KEY) === "true";
  } catch {
    return false;
  }
}
