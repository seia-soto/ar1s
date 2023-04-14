# define preboot vars
set -e;

export __AA_BOOT="1";
export __AA_BASEDIR="$(dirname "$(readlink -f "$0")")";

echo "Set __AA_BOOT to $__AA_BOOT";
echo "Set __AA_BASEDIR to $__AA_BASEDIR.";

if [[ -f './test/deps/aavars.sh' ]]; then
  export __AA_BASEDIR="$(dirname "$(readlink -f "./test/deps/aavars.sh")")";

  echo "Fixed __AA_BASEDIR to $__AA_BASEDIR.";
fi;
