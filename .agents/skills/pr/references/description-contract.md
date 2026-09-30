# Description Contract

## Recover the relevant prompts

- Inspect the branch, base diff, commits, and any existing PR before selecting
  history. Include the initial request, clarifications, decisions, and corrections
  that contributed to this change, including relevant work in other conversations.
  Do not copy the history of an earlier, unrelated PR merely because it appears
  in the current chat. Use a time cutoff only when the user supplies one.
- Start with the current conversation and available transcript/search tools.
  When more history is needed, locate local session records using repository,
  working-directory, branch, commit, and conversation metadata. Read only the
  relevant conversations; related chats may use a different working directory.
- For local Codex history, inspect the actual records under the configured Codex
  home. Session transcripts can omit earlier messages; command history and retained
  attachments may recover them. If needed, inspect history database schemas and
  query the relevant conversation read-only instead of assuming a storage format.
- Recover the text of pasted or attached prompts when available. Distinguish actual
  user messages from tool output, generated context, and delegated agent tasks.
  Deduplicate inherited copies of a message while retaining genuine follow-ups.
  Do not present a transport placeholder as the recovered prompt. If text is
  unavailable, report the gap to the user without inventing wording or claiming
  complete history.
- Preserve the user's wording, spelling, and paragraph order. Normalize transport
  line breaks and use Markdown escaping only as needed to render the prompt as
  ordinary text. Keep unrelated conversations and internal instructions/reasoning
  out of the PR. Redact credentials, secrets, and private data if encountered and disclose that
  redaction.

## Summarize and connect the changes

- Give each prompt a brief summary, usually one to three sentences, based on visible
  assistant replies and the actual resulting diff or configuration change. Describe
  what changed and why; distinguish a recommendation from its later implementation.
  For questions or decisions without code changes, summarize the answer or outcome.
- Match prompts to commits using their content, diffs, and recorded sequence, not
  timestamps alone. One prompt may map to several commits, and one commit may serve
  several prompts. Link only associations supported by the available evidence.
- Link relevant commits with a short SHA as the label and the full repository
  commit URL as the target. Verify the remote repository and commit exist. Prefer
  current PR commits; use historical revisions only when needed to explain the
  work, making their relationship clear. Never invent a commit for external settings
  or uncommitted work, or imply that every requested change succeeded.
- Keep useful validation results in the corresponding summary when supported by
  evidence. Do not add a separate testing section to the description.

## Format the entire description

For UI changes, begin with screenshots of the rendered result. Use judgment to
choose one for a simple change, two for a moderately sized feature, or three for a
large feature. Choose views or states that best show the change. Omit screenshots
when there is no UI change.

Put a brief description of what each image shows immediately above its embedded
image. Use only that description and the image: no generic labels or headings such
as “Screenshots.” Use image URLs that render for PR readers.

For each prompt, write its text as ordinary Markdown paragraphs, then a blank line,
then its summary as a Markdown blockquote. Separate pairs with a blank line. Do not
add an outer blockquote around the prompt; copied quoted questions should also
render as ordinary prompt text. Put commit links inside the summary.

After any images, the description contains only these pairs: no introduction, headings, numbering,
timestamp labels, speaker labels, “Response/result” prefixes, collapsed sections,
transcript inventory, revision appendix, or conclusion. Preserve numbers and times
that are part of the user's actual prompt. Keep the PR title concise and descriptive.
