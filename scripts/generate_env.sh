#!/bin/bash

CONFIG_FILE="env/openpaas.js"

mkdir -p env

# Recreate config file
rm -f ./$CONFIG_FILE
touch ./$CONFIG_FILE

# Add assignment
echo "window.openpaas = {" >> ./$CONFIG_FILE

for key in $(env | awk -F "=" '{print $1}' | grep "OPENPAAS.*")
# key is something like OPENPAAS_API_URL
do
    # Append configuration property to JS file
    echo "  $key: \"$(printenv $key)\"," >> ./$CONFIG_FILE
done

echo "}" >> ./$CONFIG_FILE
