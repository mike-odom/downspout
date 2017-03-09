#!/bin/bash

source config.sh

# Destroy everything, these were just symlinks and stuff anyways.
rm -R toUpload/*

# Folder with .avi and .srt
./deluge.sh "Small Movie" "SmallMovie.avi" ${baseMediaDir}/movies
./deluge.sh "Small Show" "SmallShow.avi" ${baseMediaDir}/tv