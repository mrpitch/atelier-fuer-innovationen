#!/bin/bash

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_REF" == "main"  ]] ; then
  # Proceed with the build
  echo "✅ - main branch, build can proceed"
  exit 1;

else
  # Don't build
  echo "🛑 - build cancelled"
  exit 0;
fi
