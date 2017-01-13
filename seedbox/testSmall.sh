#!/bin/bash

# Destroy everything, these were just symlinks and stuff anyways.
rm -R ../toUpload

# Folder with .avi and .srt
./deluge.sh "TMNT" "TMNT" /microverse/library/SeedboxSync/testFiles/movies
./deluge.sh "Smallworld" "Smallworld.avi" /microverse/library/SeedboxSync/testFiles/tv