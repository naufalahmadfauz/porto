# Issue tracker: GitHub

Issues and specs live in https://github.com/naufalahmadfauz/porto/issues.
Use the `gh` CLI from the repository root. Outside the clone, pass
`--repo naufalahmadfauz/porto` to issue commands.

## Issue operations

- Publish a spec or ticket:
  `gh issue create --title "..." --body-file <file>`
  Use `--body-file -` with a quoted heredoc for multiline input.
- Fetch the full ticket, labels, and discussion:
  `gh issue view <number> --json number,title,body,labels,comments,state,url`
- List open work:
  `gh issue list --state open --limit 100 --json number,title,labels,url`
  Add `--label` or change `--state` as needed.
- Comment: `gh issue comment <number> --body-file <file>`
- Apply/remove labels:
  `gh issue edit <number> --add-label "..." --remove-label "..."`
- Claim: `gh issue edit <number> --add-assignee @me`
- Close with a resolution: `gh issue close <number> --comment "..."`

Resolve label roles through `docs/agents/triage-labels.md`.
Link relevant project documents from issues; keep acceptance criteria
and progress in the issue.

## Parent tickets and blockers

- Create a child: `gh issue create --parent <parent> --title "..." --body-file <file>`
- Link an existing child: `gh issue edit <parent> --add-sub-issue <child>`
- Add a blocker: `gh issue edit <child> --add-blocked-by <blocker>`
- Remove a blocker: `gh issue edit <child> --remove-blocked-by <blocker>`
- Read blockers:
  `gh api --paginate repos/{owner}/{repo}/issues/<child>/dependencies/blocked_by`

These CLI relationship arguments accept issue numbers or URLs.
Create blocking tickets first. A ticket is ready when all its blockers
are closed. If native relationships are unavailable, record
`Part of #<parent>` and `Blocked by: #<blocker>` in the issue body.

## Wayfinding

When using `wayfinder`, the map is a parent issue labelled `wayfinder:map`.
Child labels are `wayfinder:research`, `wayfinder:prototype`,
`wayfinder:grilling`, or `wayfinder:task`; create these labels when needed.
Choose an unassigned open child whose blockers are closed, then claim it.
Record the answer, close the resolved child, and link the decision from
the map.

## Pull requests as a triage surface

**PRs as a request surface: no.**
