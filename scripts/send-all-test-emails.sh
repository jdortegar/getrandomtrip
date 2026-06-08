#!/bin/bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

TO="${1:-jd.ortega83@gmail.com}"
DELAY="${2:-300}"  # seconds between sends (default 5 min)

TEMPLATES=(
  NewsletterGoLive
  XsedCampaign
  ExperienceApproved
  ExperienceRejected
  BookingConfirmed
  PaymentFailed
  DestinationRevealed
  TripCancelled
  TripCompleted
  ExperienceSubmitted
  WelcomeEmail
)

TOTAL=${#TEMPLATES[@]}
echo "[$(date '+%H:%M:%S')] Starting — $TOTAL emails to $TO, ${DELAY}s apart"

for i in "${!TEMPLATES[@]}"; do
  TEMPLATE="${TEMPLATES[$i]}"
  NUM=$((i + 1))

  echo "[$(date '+%H:%M:%S')] ($NUM/$TOTAL) Sending $TEMPLATE..."
  npx tsx scripts/send-test-email.ts "$TEMPLATE" "$TO"
  echo "[$(date '+%H:%M:%S')] ✓ $TEMPLATE sent."

  if [ "$NUM" -lt "$TOTAL" ]; then
    echo "[$(date '+%H:%M:%S')] Waiting ${DELAY}s before next..."
    sleep "$DELAY"
  fi
done

echo "[$(date '+%H:%M:%S')] Done — all $TOTAL emails sent."
