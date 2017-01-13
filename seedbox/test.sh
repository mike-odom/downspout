#!/bin/bash

# Destroy everything, these were just symlinks and stuff anyways.
rm -R ../toUpload

# Folder with .avi and .srt
./deluge.sh "Sausage Party" "Sausage Party" /microverse/library/SeedboxSync/testFiles/movies
./deluge.sh "Brooklyn Nine-Nine - S01E02 - The Tagger" "Brooklyn Nine-Nine - S01E02 - The Tagger.mkv" /microverse/library/SeedboxSync/testFiles/tv