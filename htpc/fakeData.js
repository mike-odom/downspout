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
    }

};

module.exports = fakeData;