/**
 * Created by Aleksey Chichenkov <a.chichenkov@initi.ru> on 10/23/18.
 */

var http = require('http');
var fs = require('fs');
var Config = JSON.parse(fs.readFileSync("config.json", "utf8"));

var port = Config.port || 3000;
var ROOT_FILE = Config.default_file || "index.html";
var WEB_FOLDER = Config.web_root || __dirname;

var requestHandler = function(request, response) {
    console.log("");
    console.log("");
    console.log("INCOMING URL: ", request.url);
    if(valid_url(request.url)) { // check chars in url
        var url = process_url(request.url); // get path and query
        var info = path_info(url.path); // getr info file or not file

        console.log("URL INFO: ", JSON.stringify(url));
        console.log("PATH INFO: ", JSON.stringify(info));

        var rel_path;
        var load_file = false;
        var type;
        if(!info.is_file) {
            type = get_type(ROOT_FILE);
            console.log("TYPE: PATH");
            rel_path = url.path + ROOT_FILE;
            load_file = true;
        } else {
            console.log("TYPE: FILE");
            type = get_type(info.file);

            if(valid_type(type)){
                console.log("VALID TYPE");
                rel_path = url.path;
                load_file = true;
            } else {
                console.log("INVALID TYPE", info.file);
            }
        }

        var fpath = WEB_FOLDER + rel_path;
        // console.log(load_file, rel_path);
        console.log("WEB_FOLDER: ", WEB_FOLDER);
        console.log("rel_path: ", rel_path);
        console.log("RESULT PATH: ", fpath);
        if(load_file && fs.existsSync(fpath)) {
            console.log("TRY LOAD: ", fpath);

            fs.readFile(fpath, 'utf8', function (err, contents) {
                console.log("LOAD RESPONSE: ", fpath);

                if (!err) {
                    var type_info = Config.types[type];
                    console.log("type_info", JSON.stringify(type_info));
                    response.writeHead(200, {"Content-Type": type_info[0]});

                    if(type_info[1]){
                        response.end(contents, type_info[1]);
                    } else {
                        response.end(contents);
                    }

                } else {
                    console.log("");
                    console.log(" ========== ERROR ==========");
                    console.log(JSON.stringify(info, true, 3));
                    console.log(" ========== ERROR ==========");
                    console.log("");

                    response.writeHead(200, {"Content-Type": "text/plain; charset=utf-8"});
                    response.end("error on load file");
                }
            });
        } else {
            console.log("NO LOADED: ", fpath);
            response.writeHead(404, {"Content-Type": "text/plain; charset=utf-8" });
            response.end("url invalid or file does not exist");
        }
    } else {
        console.log("INVALID URL: ", request.url);
        response.writeHead(404, {"Content-Type": "text/plain; charset=utf-8" });
        response.end("url invalid");
    }
};

var server = http.createServer(requestHandler);
server.listen(port, function (err) {
    if (err) {
        return console.log('something bad happened', err);
    }
    console.log("server is listening on port: " + port);
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
    var match = _url.match(/[^a-zA-Z0-9_\-+=?\\/\.]/);
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
