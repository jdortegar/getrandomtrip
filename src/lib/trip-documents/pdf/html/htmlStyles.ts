import { htmlBaseStyles } from "./htmlBaseStyles";
import { htmlVoucherStyles } from "./htmlVoucherStyles";
import { htmlActivityStyles } from "./htmlActivityStyles";
import { htmlRoadmapStyles } from "./htmlRoadmapStyles";

/** Original design coordinates are uniformly scaled once at print. */
export const htmlStyles =
  htmlBaseStyles + htmlVoucherStyles + htmlActivityStyles + htmlRoadmapStyles;
