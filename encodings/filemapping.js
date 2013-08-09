var fs = require("fs");
var path = require("path");

// This loads the actual mapping - it is only called when you use the mapping for the first time.
function loadTable() {
	var table = {};
	var f = fs.readFileSync(require.resolve("./filemapping/" + this.fileName), "utf8");
	var i;
	var line;
	var lines = f.split("\n");
	var col;
	for (i=0; i<lines.length; i++)
	{
		line = lines[i];
		if ((line) && (line.charAt(0) !== "#"))
		{
			col = line.split("\t");
			if (col[1].trim() !== "") table[parseInt(col[0],16)] = parseInt(col[1],16);
		}
	}
	this.table = table;
}

// Scan the filemapping folder for any map files.
// More mappings can be downloaded from http://www.unicode.org/Public/MAPPINGS/
function loadDir() {
	var p = {};
	var i;
	var f;
	var arr;
	var x;
	var files = fs.readdirSync(path.join(path.dirname(module.filename), "filemapping")); // must be Sync otherwise someone might try to decode before we've loaded that encoding
	var t;
	for (i=0; i<files.length; i++)
	{
		f = files[i];
		f = f.substring(0, f.indexOf("."));
		
		// The file name contains the mapping names, separated by space
		// For example, CP949 is also known as ks_c_56011987 so the file is called "cp949 ks_c_56011987.txt"
		arr = f.split(" ");
		for (x=1; x<arr.length; x++)
		{
			p[arr[x]] = arr[0];
		}

		t = {};
		t.type = "table";
		t.init = loadTable;
		t.fileName = files[i];
		p[arr[0]] = t;
	}
	return p;
}

module.exports = loadDir();
