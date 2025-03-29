#!/bin/sh -x

if [ -d /install/node_modules ] ; then
  # --owner --group --username=... = upon copying set the created directories and files the given owner and group
  # -W = whole file
  # -r = recursive
  # -l = keep symlinks
  # -p = preserve permissions
  # -t = preserve modification times
  # -h = human-readable
  # -H = use hardlinks
  # --inplace -- to avoid
  rsync --owner --group --usermap="*:${APP_UID}" --groupmap="*:${APP_GID}" -Wrlpt -h -H --no-compress --inplace /install/node_modules /app
fi

su-exec ${APP_UID}:${APP_GID} npm start
