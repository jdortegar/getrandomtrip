"use client";
import { useState } from "react";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { TripDocumentSnapshot } from "@/lib/types/TripDocumentSnapshot";
import { DocumentDraftEditor } from "./DocumentDraftEditor";
import { useDocumentDrafts } from "./useDocumentDrafts";
import styles from "./fulfillment.module.css";
interface Props {
  countryLabels: Record<string, string>;
  locale: string;
  tripId: string;
}
export function DocumentDraftPanel({ countryLabels, locale, tripId }: Props) {
  const dictionary = locale === "en" ? en : es;
  const copy = dictionary.documentDraftPanel;
  const drafts = useDocumentDrafts(tripId);
  const [template, setTemplate] =
    useState<TripDocumentSnapshot["template"]>("hotel-voucher");
  const [candidate, setCandidate] = useState("");
  const titles = {
    "hotel-voucher": dictionary.hotelVoucherPdf.title,
    "activity-voucher": dictionary.activityVoucherPdf.title,
    "dinner-voucher": dictionary.dinnerVoucherPdf.title,
    "experience-roadmap": dictionary.experienceRoadmapPdf.title,
    "xsed-roadmap": dictionary.xsedRoadmapPdf.title,
  };
  const role =
    template === "hotel-voucher"
      ? "hotel"
      : template === "activity-voucher"
        ? "activity"
        : template === "dinner-voucher"
          ? "dinner"
          : null;
  const candidates = role ? drafts.candidates[role] : [];
  function allowSwitch() {
    return (
      !drafts.dirty || window.confirm(dictionary.documentDraftEditor.discard)
    );
  }
  return (
    <section className="my-6 flex flex-col gap-4 rounded border border-gray-200 p-4">
      <h3>{copy.title}</h3>
      <button
        className={styles.btn}
        disabled={drafts.busy}
        onClick={() => void drafts.list()}
        type="button"
      >
        {copy.load}
      </button>
      <label>
        {copy.template}
        <select
          disabled={drafts.busy}
          onChange={(event) => {
            setTemplate(event.target.value as typeof template);
            setCandidate("");
          }}
          value={template}
        >
          {Object.entries(titles).map(([key, title]) => (
            <option key={key} value={key}>
              {title}
            </option>
          ))}
        </select>
      </label>
      {candidates.length > 0 && (
        <label>
          {copy.provider}
          <select
            disabled={drafts.busy}
            onChange={(event) => setCandidate(event.target.value)}
            value={candidate}
          >
            <option value="">{copy.none}</option>
            {candidates.map((item) => (
              <option key={item.index} value={item.index}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        className={styles.btn}
        disabled={drafts.busy}
        onClick={() => {
          if (allowSwitch())
            void drafts.create(
              template,
              candidate === "" ? undefined : Number(candidate),
            );
        }}
        type="button"
      >
        {copy.create}
      </button>
      <ul>
        {drafts.drafts.map((row) => (
          <li key={row.id}>
            <button
              className={styles.btn}
              data-open-draft
              disabled={drafts.busy}
              onClick={() => {
                if (allowSwitch()) void drafts.open(row.id);
              }}
              type="button"
            >
              {row.document.label || titles[row.document.template]}
            </button>
          </li>
        ))}
      </ul>
      {drafts.busy && <p role="status">{copy.pending}</p>}
      {drafts.error && (
        <p role="alert">
          {drafts.error === "conflict" ? copy.conflict : copy.error}
        </p>
      )}
      {drafts.error === "conflict" && drafts.selected && (
        <button
          className={styles.btn}
          onClick={() => {
            if (allowSwitch()) void drafts.open(drafts.selected!.id);
          }}
          type="button"
        >
          {copy.reload}
        </button>
      )}
      {drafts.selected && !drafts.dirty && !drafts.busy && (
        <p role="status">{copy.saved}</p>
      )}
      {drafts.document && (
        <DocumentDraftEditor
          busy={drafts.busy}
          countryLabels={countryLabels}
          dictionary={dictionary}
          dirty={drafts.dirty}
          onChange={drafts.edit}
          onClose={drafts.close}
          onSave={() => void drafts.save()}
          value={drafts.document}
        />
      )}
    </section>
  );
}
