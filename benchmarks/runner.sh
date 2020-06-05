#!/bin/bash -e

# This bash script installs a set of Node.js versions and executes a provided script using each of them in order.
# This is useful to get stats across a range of Node versions.
# The script is expected to output its results in a single, tab-separated line. The output of this script is in the same format
# except the node version is prepended.
# Initially the script will be run with "--header" argument and it must output the header line in the same format.

# This bash script requires https://github.com/tj/n to be installed, but does not switch the active node version.

# Arguments, passed using environment variables
SCRIPT_TO_RUN="${1:?Please provide script to run as the first argument}"
shift
SCRIPT_ARGS=("$@")
NODE_VERSIONS="${NODE_VERSIONS:- 0.10.48 0.12.18 4.9.1 6.17.1 8.16.2 10.17.0 12.16.3 13.3.0 14.3.0}"
NODE_ARGS="${NODE_ARGS:- --expose_gc}"

TIMES="${TIMES:-1}"       # Number of times to run the script for each Node version
AGG="${AGG:-}"            # Aggregate results for all iterations within each Node version. Possible values: MIN, MAX, SUM, AVG, MEDIAN
AGG_VERS="${AGG_VERS:-}"  # Aggregate results across all versions of Node. Same possible values as above.

DO_DRY_RUN="${DO_DRY_RUN:-}"  # Run the script once without showing results before actual runs. This is useful to cache everything in memory.
PURGE_DISK_CACHE="${PURGE_DISK_CACHE:-}"  # Drop disk caches before each run

# Local variables
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ICONV_DIR="$(dirname "$SCRIPT_DIR")"
NODE_VERSIONS_ARR=($NODE_VERSIONS)  # Convert to array

# Move current 'node_modules' folder temporarily so that it doesn't conflict with other node versions
if [ -L "$ICONV_DIR/node_modules" ]; then
    echo "node_modules is a symlink (likely stale from previous runs). Removing."
    rm "$ICONV_DIR/node_modules"
fi
if [ -d "$ICONV_DIR/node_modules" ]; then
    #echo "Saving current node_modules to _node_modules.."
    mv "$ICONV_DIR/node_modules" "$ICONV_DIR/_node_modules"
fi

revert_node_modules_folder() {
    if [ -L "$ICONV_DIR/node_modules" ]; then
        rm "$ICONV_DIR/node_modules"
    fi
    if [ ! -e "$ICONV_DIR/node_modules" ] && [ -d "$ICONV_DIR/_node_modules" ]; then
        #echo "Restoring node_modules.."
        mv "$ICONV_DIR/_node_modules" "$ICONV_DIR/node_modules"
    fi
    trap - EXIT HUP INT
}
trap "revert_node_modules_folder" EXIT HUP INT

# Create node_modules for each node version and store them in $NODE_ENVS_DIR folder.
NODE_ENVS_DIR="$SCRIPT_DIR/node_envs"
mkdir -p "$NODE_ENVS_DIR"
for VER in $NODE_VERSIONS; do
    if [ ! -d "$NODE_ENVS_DIR/$VER" ]; then
        echo "Installing Node v$VER modules..."

        # Download corresponding node version if needed (does not switch to it).
        n --download "$VER"

        # Make sure there's no existing node_modules folder
        if [ -d "$ICONV_DIR/node_modules" ]; then
            echo "Unexpected node_modules folder"
            exit 1
        fi

        # Install needed modules
        (cd "$ICONV_DIR"; n exec "$VER" npm install --production)

        # Store node_modules folder as '$NODE_ENVS_DIR/$VER' folder
        mv "$ICONV_DIR/node_modules" "$NODE_ENVS_DIR/$VER"
    fi
done

run_script() {
    n run "$VER" $NODE_ARGS "$SCRIPT_TO_RUN" "${SCRIPT_ARGS[@]}"
}

# Generate stats
for VER in ${NODE_VERSIONS_ARR[*]}; do
    # Temporarily link node_modules for corresponding node version. It'll be reverted back to original in trap above.
    ln -snf "$NODE_ENVS_DIR/$VER" "$ICONV_DIR/node_modules"

    # Dry-run script to load everything into memory
    if [ ! -z "$DO_DRY_RUN" ]; then
        run_script  >/dev/null
    fi

    # Run the script one or several times, then optionally aggregate it and prepend node version.
    for i in $(seq $TIMES); do
        # Purge cache if needed
        if [ ! -z "$PURGE_DISK_CACHE" ]; then
            case "$(uname -s)" in
                Darwin*)  sync; sudo purge ;;
                Linux*)   sync; sudo sh -c "echo  3 > /proc/sys/vm/drop_caches"  ;;
                *)        echo "OS not supported"; exit 1
            esac
        fi

        # Print current node version unless we aggregating results.
        if [ -z "$AGG" ] && [ -z "$AGG_VERS" ]; then
            printf "$VER\t"
        fi

        # Run the script
        run_script

    done |   # <-- Note the pipeline
    if [ ! -z "$AGG" ]; then
        if [ -z "$AGG_VERS" ]; then
            printf "$VER\t"
        fi
        n run "$VER" "$SCRIPT_DIR/util/aggregate.js" "$AGG"
    else
        cat -u  # Unbuffered pass-through
    fi

done |  # <- Node versions aggregate pipeline
if [ ! -z "$AGG_VERS" ]; then
    n run "$VER" "$SCRIPT_DIR/util/aggregate.js" "$AGG_VERS"
else
    cat -u  # Unbuffered pass-through
fi

