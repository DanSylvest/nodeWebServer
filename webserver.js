/**
 * Created by Aleksey Chichenkov <a.chichenkov@initi.ru> on 10/23/18.
 */


var http = require('http');
var fs = require('fs');
var Config = JSON.parse(fs.readFileSync("config.json", "utf8"));

var port = Config.port || 3000;
var ROOT_FILE = Config.default_file || "index.html";
var WEB_FOLDER = Config.web_root || __dirname;
var _debug = Config._debug;
var _info = Config.info;

var requestHandler = function(request, response) {
    _debug && console.log("");
    _debug && console.log("");
    _info && console.log("INCOMING URL: ", request.url);
    if(valid_url(request.url)) { // check chars in url
        var url = process_url(request.url); // get path and query
        var info = path_info(url.path); // getr info file or not file

        _debug && console.log("URL INFO: ", JSON.stringify(url));
        _debug && console.log("PATH INFO: ", JSON.stringify(info));

        var rel_path;
        var load_file = false;
        var type;
        if(!info.is_file) {
            type = get_type(ROOT_FILE);
            _debug && console.log("TYPE: PATH");
            rel_path = url.path + ROOT_FILE;
            load_file = true;
        } else {
            _debug && console.log("TYPE: FILE");
            type = get_type(info.file);

            if(valid_type(type)){
                _debug && console.log("VALID TYPE");
                rel_path = url.path;
                load_file = true;
            } else {
                _debug && console.log("INVALID TYPE", info.file);
            }
        }

        var fpath = WEB_FOLDER + rel_path;
        _debug && console.log("WEB_FOLDER: ", WEB_FOLDER);
        _debug && console.log("rel_path: ", rel_path);
        _debug && console.log("RESULT PATH: ", fpath);
        if(load_file && fs.existsSync(fpath)) {
            _debug && console.log("TRY LOAD: ", fpath);


            var type_info = Config.types[type];
            _debug && console.log("type_info", JSON.stringify(type_info));

            if (type_info.binary) {
                var contents = fs.readFileSync(fpath);
                response.writeHead(200, {
                    'Content-Type': type_info.mime
                });
                response.write(contents, 'binary');
                response.end();
            } else {
                fs.readFile(fpath, 'utf8', function (err, contents) {
                    _debug && console.log("LOAD RESPONSE: ", fpath);
                    response.writeHead(200, {
                        'Content-Type': type_info.mime
                    });
                    _debug && console.log("BINARY: false");
                    response.end(contents);
                });
            }
        } else {
            _debug && console.log("NO LOADED: ", fpath);
            response.writeHead(404, {"Content-Type": "text/plain; charset=utf-8" });
            response.end("url invalid or file does not exist");
        }
    } else {
        _debug && console.log("INVALID URL: ", request.url);
        response.writeHead(404, {"Content-Type": "text/plain; charset=utf-8" });
        response.end("url invalid");
    }
};

var server = http.createServer(requestHandler);
server.listen(port, function (err) {
    if (err) {
        return _info && console.log('something bad happened', err);
    }
    _info && console.log("server is listening on port: " + port);
});

var process_url = function (_url) {
    var match_query = _url.match(/\?/);
    var path;
    var has_query = false;
    var query;
    if(match_query) {
        path = _url.substring(0, match_query.index);
        query = _url.substring(match_query.index, _url.length);
        has_query = true;
    } else {
        path = _url;
    }

    return {
        path: path,
        query: query,
        has_query: has_query
    }
};


var valid_url = function (_url) {
    var match = _url.match(/[^a-zA-Z0-9_\-+=?\\/\.&]/);
    return !match;
};

var valid_type = function (_type) {
    var t = Config.types[_type];
    return t != undefined;
};

var get_type = function (_file_name) {
    var arr = _file_name.split(".");
    var type;

    if(arr.length == 1) {
        type = "";
    } else {
        type = arr[arr.length - 1]
    }

    return type;
};

var path_info = function (_path) {
    var info = {
        is_file: false
    };

    var arr = _path.split("/");

    var end = arr[arr.length - 1];
    if(end != ""){
        info.is_file = true;
        info.file = end;
    }
    return info;
};
