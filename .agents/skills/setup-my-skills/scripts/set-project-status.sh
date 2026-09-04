#!/usr/bin/env bash
# Move a GitHub Projects v2 item to the named status column.
#
# Usage: scripts/set-project-status.sh <issue-number> <status-name>
#
# <status-name> matches a column name case-insensitively; hyphens equal spaces,
# so "in-progress" and "In progress" are equivalent.
#
# Owner and repo are resolved from the current checkout via `gh repo view` —
# nothing here is tied to a specific fork. PROJECT_NUMBER below is the one
# value that can't be discovered generically (a repo can have several
# projects); setup-my-skills fills it in when it writes this file.
set -euo pipefail

PROJECT_NUMBER=REPLACE_WITH_PROJECT_NUMBER

die() { echo "ERROR: $*" >&2; exit 1; }

[[ $# -eq 2 ]] || die "Usage: $0 <issue-number> <status-name>"

ISSUE_NUMBER="$1"
STATUS_INPUT="$2"

[[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]] || die "issue-number must be a positive integer, got: $ISSUE_NUMBER"
[[ "$PROJECT_NUMBER" =~ ^[0-9]+$ ]] || die "PROJECT_NUMBER is not set — edit the top of this script with your GitHub Project's number"

# Unset any ambient GITHUB_TOKEN — it shadows gh keyring auth and produces 403s.
unset GITHUB_TOKEN

command -v gh >/dev/null 2>&1 || die "gh CLI not found. Install it and run: gh auth login"
gh auth status >/dev/null 2>&1 || die "gh is not authenticated. Run: gh auth login"

# --- resolve owner/repo from the current checkout ---
OWNER=$(gh repo view --json owner --jq '.owner.login')
REPO=$(gh repo view --json name --jq '.name')

# --- resolve project ID via gh project view ---
PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$OWNER" --format json --jq '.id' 2>/dev/null) || true
[[ -n "$PROJECT_ID" ]] || die "Project #$PROJECT_NUMBER not found for owner $OWNER"

# --- resolve Status field and its options via gh project field-list ---
FIELD_JSON=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json \
  --jq '.fields[] | select(.name == "Status")')
[[ -n "$FIELD_JSON" ]] || die "Status field not found in Project #$PROJECT_NUMBER"

FIELD_ID=$(echo "$FIELD_JSON" | jq -r '.id')

# Validate the status name against the project's actual options.
# Comparison is case-insensitive and treats hyphens as spaces ("in-progress" == "In progress").
NORMALIZED_INPUT="${STATUS_INPUT//-/ }"
OPTION_NAME=$(echo "$FIELD_JSON" | jq -r --arg input "$NORMALIZED_INPUT" \
  '.options[] | select((.name | ascii_downcase) == ($input | ascii_downcase)) | .name' | head -1)

if [[ -z "$OPTION_NAME" ]]; then
  VALID=$(echo "$FIELD_JSON" | jq -r '[.options[].name] | join(", ")')
  die "Unknown status \"$STATUS_INPUT\". Valid options: $VALID"
fi

OPTION_ID=$(echo "$FIELD_JSON" | jq -r --arg name "$OPTION_NAME" \
  '.options[] | select(.name == $name) | .id')

# --- resolve the project item ID from the issue number via GraphQL ---
# Uses a targeted query against the issue itself — not a paginated board scan —
# so it works regardless of how many items are on the board.
ITEMS_JSON=$(gh api graphql -f query='
  query($owner:String!, $repo:String!, $number:Int!) {
    repository(owner:$owner, name:$repo) {
      issue(number:$number) {
        projectItems(first:20) {
          nodes { id project { number } }
        }
      }
    }
  }' \
  -f owner="$OWNER" -f repo="$REPO" -F number="$ISSUE_NUMBER" 2>/dev/null || echo '{}')
ITEM_ID=$(echo "$ITEMS_JSON" \
  | jq -r --argjson pnum "$PROJECT_NUMBER" \
    'try (.data.repository.issue.projectItems.nodes[] | select(.project.number == $pnum) | .id) catch ""' \
  | head -1)

[[ -n "$ITEM_ID" ]] || die "Issue #$ISSUE_NUMBER is not on Project #$PROJECT_NUMBER"

# --- apply the status update ---
gh api graphql -f query='
  mutation($projectId:ID!, $itemId:ID!, $fieldId:ID!, $optionId:String!) {
    updateProjectV2ItemFieldValue(input:{
      projectId:$projectId, itemId:$itemId,
      fieldId:$fieldId,
      value:{singleSelectOptionId:$optionId}
    }) { projectV2Item { id } }
  }' \
  -f projectId="$PROJECT_ID" -f itemId="$ITEM_ID" \
  -f fieldId="$FIELD_ID" -f optionId="$OPTION_ID" \
  --jq '"ok"' >/dev/null

echo "Issue #$ISSUE_NUMBER → $OPTION_NAME"
