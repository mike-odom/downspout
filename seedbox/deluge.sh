#!/bin/bash
cd "${0%/*}"
#This script takes input from Deluge and will create symlinks and directories for each file in a torrent
# These symlinked files can then be rsync'd up to Gazorpazorp and be deleted when done.
# ex. usage: ./deluge.sh asdf South.Park.S19E03.HDTV.x264-KILLERS.mp4 /home/someuser/files/transfer/tv

torrentId=$1
torrentName=$2
torrentPath="$3/$2"

baseMediaFolder=/home/someuser/files/transfer/tv

if [[ $torrentPath != *$baseMediaFolder* ]]
then
    echo "Error, torrent path isn't in baseMediaFolder: $torrentPath"
    exit
fi

echo $torrentPath
destDir="./toUpload"

echo "--------------" >> lftp.log
echo "Uploading $torrentPath" >> lftp.log

basePath="${torrentPath/$baseMediaFolder/}"
echo "basePath: $basePath"
if [ -d "$torrentPath" ]; then
        mkdir -p "$destDir/$basePath"

        //TODO: Directory, place __seedbox_sync_folder__ marker inside
            so syncer knows to treat this folder as it's own contained entity

        #If it's a directory, we need to recurse through
        find "$torrentPath" -mindepth 1 -printf "%P\n" | while read f
        do
                if [ -d "$torrentPath/$f" ]; then
                        newDir=$destDir/$basePath/$f
                        echo "Making dir $newDir"
                        mkdir -p "$newDir"
                else
                        srcFile=$torrentPath/$f
                        destLink=$destDir/$basePath/$f
                        echo "Linking $srcFile to $destLink"

                        ln -s "$srcFile" "$destLink";
                fi
        done
else
        #it's a file
        destLink="$destDir/$basePath"

        destDir=$(dirname "$destLink")

        mkdir -p "$destDir"

        fileName=$(basename "$torrentPath")
        destLink=$destDir/$fileName
        ln -s "$torrentPath" "$destLink"
fi

#./upload.sh &