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
  echo "coping..."
  rsync --owner --group --usermap="*:${APP_UID}" --groupmap="*:${APP_GID}" -Wrlpt -h -H --no-compress --inplace /install/node_modules /app/
fi

if [[ $REACT_APP_ENVIRONMENT = "production" ]]
then
  echo "Staring production node js server..."
  # su-exec -H -u node npm i -g serve
  # su-exec ${APP_UID}:${APP_GID} npm run build
  su-exec ${APP_UID}:${APP_GID} npx serve -s build -p ${FRONTEND_PORT_INTERNAL}
else
  echo "Starting development node js server..."
  su-exec ${APP_UID}:${APP_GID} npm start
fi