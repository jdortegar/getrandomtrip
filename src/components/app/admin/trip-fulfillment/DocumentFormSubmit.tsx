"use client";
import { useContext } from "react";
import { DocumentFormWorkflowContext } from "./DocumentFormWorkflowContext";
import styles from "./fulfillment.module.css";
export function DocumentFormSubmit({ label }: { label: string }) {
  const workflow = useContext(DocumentFormWorkflowContext);
  return workflow ? null : (
    <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">
      {label}
    </button>
  );
}
