var res = [];

function millis() {
    var parts = process.hrtime();
    return parts[0] * 1e3 + parts[1] * 1e-6;
}
var start = millis();

function addtime() {
    var curt = millis();
    res.push((curt-start).toFixed(2));
    start = curt;
}

// Give V8 a chance to optimize both functions
for (var i = 0; i < 1000; i++) {
    addtime();
}

// Amusingly we need to call global.gc() multiple times to get GC to fully kick in.
function garbage_collect() {
    for (var i = 0; i < 10; i++) {
        global.gc();
    }
}

// Print header
// console.log([
//     "iconv load, ms", "encodings, ms", "tables, ms",
//     "iconv heapUsed, kb", "encodings heapUsed, kb", "tables heapUsed, kb",
// ].join("\t"));

// Reset the tracking
res.length = 0;
garbage_collect();
var mem = [];

// Wait for 0.1 sec so that Node could finish all async operations it accumulated.
setTimeout(function() {
    garbage_collect();
    mem.push(process.memoryUsage());
    start = millis();

    // Load base iconv-lite, optionally applying the new preloading logic.
    var iconv = require("../");
    if (process.env.ICONV_PRELOAD) {
        iconv.preloadCodecsAndData();
    }

    addtime();
    garbage_collect();
    mem.push(process.memoryUsage());
    
    // Load all encoding definitions.
    start = millis();
    iconv.encodings = require("../encodings");
    addtime();
    garbage_collect();
    mem.push(process.memoryUsage());
    
    // Load tables
    var encodings = ["shiftjis", "eucjp", "cp936", "gb18030", "cp949", "cp950", "big5hkscs"];
    var tables = [];
    
    start = millis();
    for (var i = 0; i < encodings.length; i++) {
        tables.push(iconv.encodings[encodings[i]].table());
    }
    addtime();
    garbage_collect();
    mem.push(process.memoryUsage());
    
    var memTypes = [/*"rss",*/ "heapUsed"];
    for (var j = 0; j < memTypes.length; j++) {
        for (var i = 1; i < mem.length; i++) {
            var mt = memTypes[j];
            res.push(((mem[i][mt] - mem[i-1][mt])/1024).toFixed(0));
        }
    }
    
    console.log(res.join("\t"));
}, 100);