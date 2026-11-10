import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import BlogApproved from "../BlogApproved";
import BlogRejected from "../BlogRejected";
import ExperienceApproved from "../ExperienceApproved";
import ExperienceRejected from "../ExperienceRejected";

const BASE = "https://getrandomtrip.com/en/dashboard/tripper";

describe("tripper review emails", () => {
  it.each([
    [
      "BlogApproved",
      <BlogApproved
        key="a"
        tripper="Ana"
        blogTitle="Post"
        blogId="blog_1"
        locale="en"
      />,
      `${BASE}/blog/blog_1`,
    ],
    [
      "BlogRejected",
      <BlogRejected
        key="b"
        tripper="Ana"
        blogTitle="Post"
        blogId="blog_1"
        reviewNote="Fix it"
        locale="en"
      />,
      `${BASE}/blog/blog_1`,
    ],
    [
      "ExperienceApproved",
      <ExperienceApproved
        key="c"
        tripper="Ana"
        experienceTitle="Exp"
        experienceId="exp_1"
        locale="en"
      />,
      `${BASE}/experiences/exp_1`,
    ],
    [
      "ExperienceRejected",
      <ExperienceRejected
        key="d"
        tripper="Ana"
        experienceTitle="Exp"
        experienceId="exp_1"
        reviewNote="Fix it"
        locale="en"
      />,
      `${BASE}/experiences/exp_1`,
    ],
  ])("%s links the CTA to the reviewed item", async (_name, email, href) => {
    expect(await render(email)).toContain(`href="${href}"`);
  });
});
