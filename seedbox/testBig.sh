#!/bin/bash

source config.sh

# Destroy everything, these were just symlinks and stuff anyways.
rm -R toUpload/*

# Folder with .avi and .srt
./deluge.sh "Big Movie" "BigMovie.avi" ${baseMediaDir}/movies
./deluge.sh "Big Show" "BigShow.avi" ${baseMediaDir}/tv