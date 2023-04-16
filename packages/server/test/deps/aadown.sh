set -e;

. "$__AA_BASEDIR/aacheck.sh";

echo "Shutting down $CONTAINER_NAME ($IMAGE)";

CONTAINER_ID="$(docker ps -aqf "name=$CONTAINER_NAME")";

if [[ ! -z "$CONTAINER_ID" ]]; then
  docker stop "$CONTAINER_ID";
  docker rm "$CONTAINER_ID";
fi;

# wait for the port to be released
while true; do
  echo "Waiting the port $PORT to be released...";

  if [[ -z "$(lsof -i -n -P | grep 'LISTEN' | grep ":$PORT")" ]]; then
    echo "Released!";

    break;
  fi;

  sleep 1;
done;

echo "Shutted down $CONTAINER_NAME ($IMAGE)";
