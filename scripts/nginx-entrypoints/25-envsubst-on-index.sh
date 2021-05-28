#!/bin/sh

set -e

ME=$(basename $0)

envsubst_index() {
    local index_location="/usr/share/nginx/html/index.html"
    local index_orig_location="/var/index.html.orig"

    if [ ! -e $index_orig_location ]; then
        echo >&3 "$ME: Copying $index_location to $index_orig_location"
        cp $index_location $index_orig_location
    fi
    
    echo >&3 "$ME: Substitute PREFIX_PLACEHOLDER variable to $PREFIX on $index_orig_location to $index_location"
    sed s/PREFIX_PLACEHOLDER/$PREFIX/g $index_orig_location > $index_location
}

envsubst_index

exit 0