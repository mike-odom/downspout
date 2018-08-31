/*
   taken from https://github.com/firerap/jsftp-lsr

   Changed path to upath to get support on Windows machines

   I don't how to create node modules just yet, so I'm not doing any pull requests on this module.
  */
var path = require("upath");
var async = require("async");

var FTP_DIR_TYPE = 1;

function _lsrFindPath(data, obj, _prefix) {
    var prefix = _prefix ? path.join(_prefix, data.name) : data.name;
    if(data == obj) {
        return prefix;
    }
    for(var i = 0; i < data.children.length; ++i) {
        if(data.children[i] === obj) {
            return path.join(prefix, data.children[i].name);
        }

        if(data.children[i].children) {
            var result = _lsrFindPath(data.children[i], obj, prefix);
            if(result) return result;
        }
    }

    return null;
}

function lsr(root, callback) {
    var ftp = this;

    var result = [{
        type: FTP_DIR_TYPE,
        name: ".",
        children: []
    }];
    var currentDirectory = result[0];
    async.doWhilst(
        function iter(clb) {
            var _path = _lsrFindPath(result[0], currentDirectory, root);

            ftp.ls(_path, function(err, data) {
                if(err) return clb(err);
                currentDirectory.children = data;
                clb();
            })

        }, function test(arg) {
            var _result = arg || result;

            return _result.some(function(item) {
                if(item.type === FTP_DIR_TYPE && !item.children) {
                    currentDirectory = item;
                    return true;
                }
                if(item.type === FTP_DIR_TYPE) {
                    return test(item.children); // If directory has children.
                }

                return false; // If item is not directory.
            })
        }, function done(err) {
            if(err) return callback(err);
            callback(null, result[0].children || []);
        })

}

module.exports = function (JSFtp) {
    JSFtp.prototype = Object.create(JSFtp.prototype, {
        lsr: {
            value: lsr
        }
    });

    return JSFtp;
};