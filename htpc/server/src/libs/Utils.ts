const sanitize = require("sanitize-filename");
const path = require('path');
const _ = require('underscore');

class Utils {
  /**
   * Takes a path like "moo/cow/some silly : path/movie.avi"
   * and returns "moo/cow/../some silly path/movie.avi"
   *
   * @param {string} thePath
   * @returns {string}
   */
    public static sanitizeFtpPath(thePath: string) : string {
        let inputSections = thePath.split('/');
        let resultSections = [];

        _.forEach(inputSections, (section) => {
          let sanitized = sanitize(section);

          if (sanitized.length) {
            resultSections.push(sanitized);
          }
        });

        return resultSections.join('/');
    }
}

export { Utils }