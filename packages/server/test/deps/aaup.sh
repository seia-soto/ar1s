set -e;

. "$__AA_BASEDIR/aacheck.sh";
. "$__AA_BASEDIR/aadown.sh";

echo "Booting up $CONTAINER_NAME ($IMAGE)";

docker run --name "$CONTAINER_NAME" --publish "127.0.0.1:$PORT:$PORT" --env-file "$__AA_BASEDIR/$ENV_FILE" --detach "$IMAGE";

echo "Booted up $CONTAINER_NAME:$PORT";
