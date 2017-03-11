#!/usr/bin/env bash

scriptpath="$(dirname $(readlink -f "$0"))"

echo $scriptpath

source $scriptpath/config.sh

${scriptpath}/makeSymLink.sh "$@" | tee -a ${scriptpath}/seedbox.log