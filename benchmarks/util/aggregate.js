// Simple script that aggregates tab-delimited columns from stdin and outputs tab-delimited result to stdout.
// Aggregation method should be given as the first argument. Possible values: MIN, MAX, SUM, AVG, MEDIAN.
// Non-numeric columns are required to have the same values in all lines.

var aggregations = {
    min: function(arr) {
        return Math.min.apply(Math, arr);
    },
    max: function(arr) {
        return Math.max.apply(Math, arr);
    },
    sum: function(arr) {
        return arr.reduce(function(a, b) { return a + b}, 0);
    },
    avg: function(arr) {
        return aggregations.sum(arr) / arr.length;
    },
    mean: function(arr) {
        return aggregations.avg(arr);
    },
    median: function(arr) {
        if (arr.length === 0) return 0;
        arr.sort(function(a, b){ return a-b; });
        var halfIdx = Math.floor(arr.length / 2);
        return (arr.length % 2) ? arr[halfIdx] : ((arr[halfIdx - 1] + arr[halfIdx]) / 2.0);
    },
};

var agg = (process.argv[2] || "").toLowerCase();
if (!agg) {
    console.error("Aggregation type must be provided as the first argument.");
    process.exit(1);
}
var aggFunc = aggregations[agg];
if (!aggFunc) {
    console.error("Unknown aggregation: ", agg);
    process.exit(1);
}

// Read everything from stdin (don't bother streaming).
process.stdin.setEncoding('utf8');
var stdin = "";
process.stdin.on('readable', function() {
    var chunk;
    while ((chunk = process.stdin.read()) !== null) {
        stdin += chunk;
    }
});
process.stdin.on('end', function() {
    processLines(stdin.split("\n").filter(Boolean));
})

function processLines(lines) {
    if (lines.length == 0) {
        return;
    }
    
    // Split to columns.
    var cols = [];
    lines.forEach(function(line, idx) {
        //console.log("Processing line "+line);
        var vals = line.split("\t");
        if (cols.length === 0) {
            for (var i = 0; i < vals.length; i++) {
                cols.push([vals[i]]);
            }
        } else if (vals.length != cols.length) {
            console.error("Number of columns doesn't match on line "+idx+": "+vals.length+" vs "+cols.length);
            process.exit(1);
        } else {
            for (var i = 0; i < vals.length; i++) {
                cols[i].push(vals[i]);
            }
        }
    });
    
    // Aggregate each column.
    var agg = cols.map(function(vals, idx) {
        if (!vals.some(isNaN)) {
            // Numeric column. Do the aggregation.
            var res = aggFunc(vals.map(Number));

            var maxPrecision = Math.max.apply(null, vals.map(function(v) {
                var dotPos = v.indexOf(".");
                return dotPos == -1 ? 0 : (v.length - dotPos - 1);
            }));

            return res.toFixed(maxPrecision + 1);  // Use max precision of all nums in column + 1.
        } else {
            // Non-numeric column.
            if (vals.every(function(v) { return v === v[0]; })) {
                return vals[0];  // Whole columns contains the same value -> output it
            } else {
                return "<various>";
            }
        }
    });
    
    // Output aggregates tab-separated.
    console.log(agg.join("\t"));
}
