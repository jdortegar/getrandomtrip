/**
 * Table-only HTML for pasting into email clients. Pass a site origin with no trailing slash
 * (e.g. https://getrandomtrip.com) so image src values resolve in outbound mail.
 */

function joinSiteOrigin(origin: string, pathname: string): string {
  const base = origin.replace(/\/$/, '');
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

export function buildEmailSignatureOption1Html(siteOrigin: string): string {
  const logoSrc = joinSiteOrigin(siteOrigin, '/assets/svg/email-sign.svg');
  return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse">
        <tbody>
          <tr>
            <td style="font-family: 'Barlow', Helvetica, Arial, sans-serif">
              <span
                style="
                  color: #1b2b36;
                  font-family: 'Barlow Condensed', 'Arial Narrow', Helvetica, Arial, sans-serif;
                  font-size: 22px;
                  font-weight: 700;
                  letter-spacing: 0.03em;
                "
                >Ana Lucía Ríos</span
              >
            </td>
          </tr>
          <tr>
            <td
              style="
                border-bottom: 2px solid #f7cb34;
                font-family: 'Barlow', Helvetica, Arial, sans-serif;
                padding: 0 0 12px;
              "
            >
              <span style="color: #3d5163; font-size: 14px; font-weight: 500">Customer Success Manager</span>
            </td>
          </tr>
          <tr>
            <td style="font-family: 'Barlow', Helvetica, Arial, sans-serif; padding: 12px 0 4px">
              <a
                href="mailto:ana.rios@getrandomtrip.com"
                style="color: #1b2b36; font-family: 'Barlow', Helvetica, Arial, sans-serif; font-size: 14px; text-decoration: underline"
                >ana.rios@getrandomtrip.com</a
              >
              <span style="color: #b8c5ce"> &nbsp;|&nbsp; </span>
              <a
                href="tel:+523398765432"
                style="color: #1b2b36; font-family: 'Barlow', Helvetica, Arial, sans-serif; font-size: 14px; text-decoration: none"
                >+52 33 9876 5432</a
              >
              <span style="color: #b8c5ce"> &nbsp;|&nbsp; </span>
              <a
                href="https://getrandomtrip.com"
                style="color: #1b2b36; font-family: 'Barlow', Helvetica, Arial, sans-serif; font-size: 14px; text-decoration: underline"
                >getrandomtrip.com</a
              >
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0 0">
              <a href="https://getrandomtrip.com" style="text-decoration: none">
                <img
                  alt="GetRandomTrip"
                  border="0"
                  height="64"
                  src="${logoSrc}"
                  style="display: block; height: auto; max-width: 237px; width: 237px"
                  width="237"
                />
              </a>
            </td>
          </tr>
        </tbody>
      </table>`;
}

export function buildEmailSignatureOption2Html(siteOrigin: string): string {
  const logoSrc = joinSiteOrigin(siteOrigin, '/assets/logos/logo_getrandomtrip_1.png');
  return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse">
        <tbody>
          <tr>
            <td style="font-family: 'Barlow', Helvetica, Arial, sans-serif">
              <span
                style="
                  color: #1b2b36;
                  font-family: 'Barlow Condensed', 'Arial Narrow', Helvetica, Arial, sans-serif;
                  font-size: 22px;
                  font-weight: 700;
                  letter-spacing: 0.03em;
                "
                >Ana Lucía Ríos</span
              >
            </td>
          </tr>
          <tr>
            <td
              style="
                border-bottom: 2px solid #f7cb34;
                font-family: 'Barlow', Helvetica, Arial, sans-serif;
                padding: 0 0 12px;
              "
            >
              <span style="color: #3d5163; font-size: 14px; font-weight: 500">Customer Success Manager</span>
            </td>
          </tr>
          <tr>
            <td bgcolor="#1b2b36" style="background-color: #1b2b36; padding: 16px 20px">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse">
                <tbody>
                  <tr>
                    <td style="font-family: 'Barlow', Helvetica, Arial, sans-serif; padding: 0 0 4px">
                      <a
                        href="mailto:ana.rios@getrandomtrip.com"
                        style="color: #ffffff; font-family: 'Barlow', Helvetica, Arial, sans-serif; font-size: 14px; text-decoration: underline"
                        >ana.rios@getrandomtrip.com</a
                      >
                      <span style="color: #6b7f8f"> &nbsp;|&nbsp; </span>
                      <a
                        href="tel:+523398765432"
                        style="color: #ffffff; font-family: 'Barlow', Helvetica, Arial, sans-serif; font-size: 14px; text-decoration: none"
                        >+52 33 9876 5432</a
                      >
                      <span style="color: #6b7f8f"> &nbsp;|&nbsp; </span>
                      <a
                        href="https://getrandomtrip.com"
                        style="color: #ffffff; font-family: 'Barlow', Helvetica, Arial, sans-serif; font-size: 14px; text-decoration: underline"
                        >getrandomtrip.com</a
                      >
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0">
                      <a href="https://getrandomtrip.com" style="text-decoration: none">
                        <img
                          alt="GetRandomTrip"
                          border="0"
                          height="64"
                          src="${logoSrc}"
                          style="display: block; height: auto; max-width: 237px; width: 237px"
                          width="237"
                        />
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>`;
}
