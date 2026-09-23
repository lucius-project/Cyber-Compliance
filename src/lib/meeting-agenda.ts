/**
 * Standard prep checklist for a control being covered in a meeting. Always
 * derived at render time from the control - nothing here is persisted, so
 * there's no separate model to keep in sync with control/status changes.
 */
export function actionItemsForControl(control: { controlNumber: string; name: string }): string[] {
  return [
    `Review current implementation status of ${control.controlNumber} · ${control.name}`,
    "Confirm or assign an owner responsible for this control",
    "Gather and attach supporting evidence",
    "Note any gaps and open remediation items as needed",
    "Update status and notes in Cyber Compliance",
  ];
}
