
var request = require('request'),
    fs = require('fs'),
    path = require('path'),
    errTo = require('errto');

// Common utilities used in scripts.

exports.getFile = function(url, cb) {
    var fullpath = path.join(__dirname, "source-data", path.basename(url));
    fs.readFile(fullpath, "utf8", function(err, text) {
        if (!err) return cb(null, text);
        if (err.code != "ENOENT") return cb(err);
        request(url, errTo(cb, function(res, text) {
            fs.writeFile(fullpath, text, errTo(cb, function() {
                cb(null, text);
            }));
        }));
    });
}

// Returns array of arrays.
exports.parseText = function(text, splitChar) {
    return text.split("\n").map(function(line) {
        return line.split("#")[0].trim(); 
    }).filter(Boolean).map(function(line) {
        return line.split(splitChar || /\s+/).map(function(s) {return s.trim()}).filter(Boolean);
    });
} 


// Input: map <dbcs num> -> <unicode num>
// Resulting format: Array of chunks, each chunk is:
// [0] = address of start of the chunk, hex string.
// <str> - characters of the chunk.
// <num> - increasing sequence of the length num, starting with prev character.
exports.generateTable = function(dbcs) {

    // First create a basic table: [[<addr>, <chars>], [<addr>, <chars>], ...]
    var p = false;
    var arr = [], a;
    for (var i = 0x0000; i < 0x10000; i++)
        if (dbcs[i] !== undefined) {
            if (dbcs[i-1] === undefined)
                arr.push(a = [i.toString(16), '']);
            a[1] += String.fromCharCode(dbcs[i]);
        }

    // Find increasing sequences and RLE them.
    var minSeqLen = 4;
    for (var i = 0; i < arr.length; i++) {
        var a = arr[i];
        var s = a.pop(); // Characters were kept in a[1], save'em.
        var seqStart = 0; // Index in 's' where the increasing sequence started.
        var nonSeqStart = 0, seqLen;
        for (var j = 1; j < s.length; j++)
            if (s.charCodeAt(j-1) + 1 !== s.charCodeAt(j)) { // Increasing sequence is ended.
                seqLen = j - 1 - seqStart;
                if (seqLen >= minSeqLen) {
                    // Seq is long enough: write prev segment and its length.
                    a.push(s.slice(nonSeqStart, seqStart+1), seqLen);
                    nonSeqStart = j;
                }
                seqStart = j;
            }

        // Write last segments.
        seqLen = s.length - 1 - seqStart;
        if (seqLen >= minSeqLen)
            a.push(s.slice(nonSeqStart, seqStart+1), seqLen);
        else
            a.push(s.slice(nonSeqStart));
    }

    return arr;
}


exports.writeTable = function(name, table) {
    fs.writeFileSync(path.join(__dirname, "../encodings/tables", name + ".json"), 
        "[\n" + table.map(function(a) {return JSON.stringify(a);}).join(",\n") + "\n]\n");
}


