if [[ -z "$__AA_BOOT" ]]; then
  echo "__AA_BOOT flag was not found! Please source ./test/deps/aavars.sh before running commands.";
  exit 1;
fi;

if [[ -z "$CONTAINER_NAME" ]]; then
  echo "CONTAINER_NAME is expected!";
  exit 1;
fi;

if [[ -z "$PORT" ]]; then
  echo "PORT is expected!";
  exit 1;
fi;

if [[ -z "$IMAGE" ]]; then
  echo "IMAGE is expected!";
  exit 1;
fi;

if [[ -z "$ENV_FILE" ]]; then
  echo "ENV_FILE is expected!";
  exit 1;
fi;
