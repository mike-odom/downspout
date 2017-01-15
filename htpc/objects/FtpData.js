/**
 * Just a file to typedef data that comes back from jsftp
 */

/**
 * @typedef {object} FtpData
 * @property {string} name
 * @property {number} type
 * @property {number} time
 * @property {number} size
 * @property {number} owner
 * @property {number} group
 * @property {string} target - If a symlink, this is the actual path
 * @property {FtpPermissions} userPermissions
 * @property {FtpPermissions} groupPermissions
 * @property {FtpPermissions} otherPermissions
 */

/**
 * @typedef {object} FtpPermissions
 * @property {boolean} read
 * @property {boolean} write
 * @property {boolean} exec
 */

/**
 {
  "name": "Brooklyn Nine-Nine - S01E02 - The Tagger.mkv",
  "type": 2,
  "time": 1484376060000,
  "size": "63",
  "owner": "1000",
  "group": "1000",
  "target": "../../testFiles/tv/Brooklyn Nine-Nine - S01E02 - The Tagger.mkv",
  "userPermissions": {
    "read": true,
    "write": true,
    "exec": true
  },
  "groupPermissions": {
    "read": true,
    "write": true,
    "exec": true
  },
  "otherPermissions": {
    "read": true,
    "write": true,
    "exec": true
  }
}
 */