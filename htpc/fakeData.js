const fakeData = {
    twoFiles: function() {
        return [
            {
                "name": "toUpload",
                "type": 1,
                "time": 1481704920000,
                "size": "15",
                "owner": "pornodie",
                "group": "pornodie",
                "userPermissions": {
                    "read": true,
                    "write": true,
                    "exec": true
                },
                "groupPermissions": {
                    "read": true,
                    "write": false,
                    "exec": true
                },
                "otherPermissions": {
                    "read": true,
                    "write": false,
                    "exec": true
                },
                "children": [
                    {
                        "name": "tv",
                        "type": 1,
                        "time": 1484104020000,
                        "size": "52",
                        "owner": "pornodie",
                        "group": "pornodie",
                        "userPermissions": {
                            "read": true,
                            "write": true,
                            "exec": true
                        },
                        "groupPermissions": {
                            "read": true,
                            "write": false,
                            "exec": true
                        },
                        "otherPermissions": {
                            "read": true,
                            "write": false,
                            "exec": true
                        },
                        "children": [
                            {
                                "name": "moo.wmv",
                                "type": 0,
                                "time": 1481700300000,
                                "size": "0",
                                "owner": "pornodie",
                                "group": "pornodie",
                                "userPermissions": {
                                    "read": true,
                                    "write": true,
                                    "exec": false
                                },
                                "groupPermissions": {
                                    "read": true,
                                    "write": false,
                                    "exec": false
                                },
                                "otherPermissions": {
                                    "read": true,
                                    "write": false,
                                    "exec": false
                                }
                            },
                            {
                                "name": "newerFile.mov",
                                "type": 0,
                                "time": 1484104020000,
                                "size": "0",
                                "owner": "pornodie",
                                "group": "pornodie",
                                "userPermissions": {
                                    "read": true,
                                    "write": true,
                                    "exec": false
                                },
                                "groupPermissions": {
                                    "read": true,
                                    "write": false,
                                    "exec": false
                                },
                                "otherPermissions": {
                                    "read": true,
                                    "write": false,
                                    "exec": false
                                }
                            }
                        ]
                    }
                ]
            }
        ];
    },

    statusPage: function() {
        return {
            "stats": {
            "download_rate": 56.3,
                "max_download_rate": 5000001,
                "num_connections": 1,
                "max_num_connections": 2
        },
            "downloads": [
            {
                "filename": "TMNT.wmv",
                "source_root": "/home/odie/deluge-scripts/toUpload",
                "dest_root": "~/microverse/library/seedbox",
                "path": "movies",
                "size": 1200875243,
                "downloaded": 498672,
                "download_rate": 56.3,
                "status": "downloading",
                "date_added": "unix timestamp as integer",
                "uid": "Some unique identifier string per row"
            },
            {
                "file_name": "Gotham S02E06.wmv",
                "source_root": "/home/odie/deluge-scripts/toUpload",
                "dest_root": "~/microverse/library/seedbox",
                "path": "tv",
                "size": 306929575,
                "downloaded": 0,
                "download_rate": 0,
                "status": "queued",
                "date_added": "unix timestamp as integer",
                "uid": "Some unique identifier string per row2"
            },
            {
                "file_name": "Lost S01E03.wmv",
                "source_root": "/home/odie/deluge-scripts/toUpload",
                "dest_root": "~/microverse/library/seedbox",
                "path": "tv",
                "size": 208938103,
                "downloaded": 208938103,
                "download_rate": 0,
                "status": "completed",
                "date_added": "unix timestamp as integer",
                "date_completed": "unix timestamp as integer",
                "uid": "Some unique identifier string per row3"
            }
        ]
        }
    }
};

module.exports = fakeData;