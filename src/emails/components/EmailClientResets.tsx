import * as React from "react";

/**
 * Keeps text that mail clients auto-detect as links (Apple Mail data
 * detectors, Gmail autolinks) in our colours: "getrandomtrip.com" and the
 * postal address in the footer otherwise turn default blue. They keep an
 * underline so they still read as links. Render inside <Head>;
 * Gmail's rule needs `id="body"` on <Body>.
 */
export default function EmailClientResets() {
  return (
    <>
      <meta
        content="telephone=no, date=no, address=no, email=no, url=no"
        name="format-detection"
      />
      <meta content="no" name="x-apple-disable-message-reformatting" />
      <style>{resetCss}</style>
    </>
  );
}

const resetCss = `
a[x-apple-data-detectors], #body a[x-apple-data-detectors] {
  color: inherit !important; font-family: inherit !important; font-size: inherit !important;
  font-weight: inherit !important; line-height: inherit !important; text-decoration: underline !important;
}
u + #body a { color: inherit; font-family: inherit; font-size: inherit; font-weight: inherit; line-height: inherit; text-decoration: underline; }
`;
