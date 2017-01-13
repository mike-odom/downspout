#!/bin/bash

# Destroy everything, these were just symlinks and stuff anyways.
rm -R ../toUpload/*

# Folder with .avi and .srt
./deluge.sh "TMNT" "TMNT" /microverse/library/SeedboxSync/testFiles/movies
./deluge.sh "Small \"World\"" "Small World.avi" /microverse/library/SeedboxSync/testFiles/tv