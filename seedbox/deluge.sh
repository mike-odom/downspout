#!/bin/bash
cd "${0%/*}"
#This script takes input from Deluge and will create symlinks and directories for each file in a torrent
# The sync server will then be notified and start syncing from here.
# These symlinks will be deleted once downloaded.
#
# You will need to create a config.sh file for settings. See configError for info.
#
# This script is designed to be called by the Deluge Execute plugin after a torrent is downloaded.
#    (http://dev.deluge-torrent.org/wiki/Plugins/Execute)
# But it could be used by whatever app you wish. A simple wrapper script could make it used with any other torrent app.
#
# Usage: ./deluge.sh [Torrent Id] [File Name or Directory] [Parent directory where this file or directory is located]
# ex: ./deluge.sh "South Park" South.Park.S19E03.HDTV.x264-KILLERS.mp4 /home/someuser/files/transfer/tv

configError() {
    cat << EOM
    Error:
        $1

    You need to setup a config.sh file in the directory of this script

    It should contain:
    baseMediaDir=[The parent directory where are your torrent files reside]
    syncDir=[The folder owned by this script where symlinks will be created and downloaded from]

    example:
    baseMediaDir="/deluge/downloaded"
    syncDir="../toUpload"

    baseMediaDir is used to create relative folders inside of syncDir. If using the example settings and calling
        ./deluge "1234" "MyVideo.avi" "/deluge/downloaded/tv/someShow"
    Then the following sym link will be created
        ../toUpload/tv/someShow/MyVideo.avi -> /deluge/downloaded/tv/someShow/MyVideo.avi

    It is critical for FTP file transfers that baseMediaDir and syncDir be accessible by the FTP client
EOM
    exit
}

# Config processing

if [ ! -f config.sh ]; then
    configError "config.sh file not found"
fi

source config.sh

if [[ ! -d ${baseMediaDir} ]]; then
    configError "Invalid baseMediaDir: $baseMediaDir"
fi

if [[ ! -d ${syncDir} ]]; then
    configError "Invalid syncDir: $syncDir"
fi

argumentError() {
    cat << EOM
    Error:
        $1

    Usage: ./deluge.sh [Torrent Name] [File Name or Directory] [Parent directory where this file or directory is located]"
EOM
    exit
}

missingParameter() {
    argumentError "Missing parameter: $1"
}

# Process the command line arguments

torrentId=$1
torrentName=$2
torrentParentDir=$3

if [ -z "$torrentName" ]; then
    missingParameter "Torrent Name"
fi

if [ -z "$torrentParentDir" ]; then
    missingParameter "Parent Directory"
fi

torrentPath="$torrentParentDir/$torrentName"

if [[ ${torrentPath} != *${baseMediaDir}* ]]
then
    argumentError "Torrent path \"$torrentPath\" isn't in baseMediaDir \"$baseMediaDir\""
fi

echo ${torrentPath}

echo "--------------" >> lftp.log
echo "Uploading $torrentPath" >> lftp.log

basePath="${torrentPath/$baseMediaDir/}"
echo "basePath: $basePath"
if [ -d "$torrentPath" ]; then
        destDir="$syncDir/$basePath"
        # The torrent was a directory
        mkdir -p $destDir

        touch $destDir/__seedbox_sync_directory__

        #TODO: Directory, place __seedbox_sync_folder__ marker inside
        #    so syncer knows to treat this folder as it's own contained entity

        #If it's a directory, we need to recurse through
        find "$torrentPath" -mindepth 1 -printf "%P\n" | while read f
        do
                if [ -d "$torrentPath/$f" ]; then
                        newDir=${syncDir}/${basePath}/${f}
                        echo "Making dir $newDir"
                        mkdir -p "$newDir"
                else
                        srcFile=${torrentPath}/$f
                        destLink=${syncDir}/${basePath}/${f}
                        echo "Linking $srcFile to $destLink"

                        ln -s -r "$srcFile" "$destLink";
                fi
        done
else
        #it's a file
        destLink="$syncDir/$basePath"

        destDir=$(dirname "$destLink")

        mkdir -p "$destDir"

        fileName=$(basename "$torrentPath")

        destLink=$destDir/$fileName

        echo "Linking $torrentPath to $destLink"

        ln -s -r "$torrentPath" "$destLink"
fi

#./upload.sh &