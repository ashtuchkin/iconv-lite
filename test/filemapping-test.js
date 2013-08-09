var vows    = require("vows"),
	assert  = require("assert"),
	fs      = require("fs"),
	path    = require("path"),
	iconv   = require(__dirname+"/../");

var testStringUtf = "\u00ba\u00b0\uc96fabc",
	testStringCP949Buffer = new Buffer([0xa8, 0xac, 0xa1,0xc6, 0xa2,0xa0, 0x61, 0x62, 0x63]);

// Returns an object with a buffer (other) and a string (utf8) that contain every character
// We use this string/buffer to compare iconv-lite with iconv
function getBigText(filename) {
	var utf8 = "";
	var other = [];
	var f = fs.readFileSync(filename, "utf8");
	var i;
	var line;
	var lines = f.split("\n");
	var col;
	var x;
	for (i=0; i<lines.length; i++)
	{
		line = lines[i];
		if ((line) && (line.charAt(0) !== "#"))
		{
			col = line.split("\t");
			if (col[1].trim() !== "")
			{
				x = parseInt(col[0],16);
				if (x > 127) other.push((x >> 8) & 0xff);
				other.push(x & 0xff);
	
				x = parseInt(col[1],16);
				utf8 += String.fromCharCode(x);
			}
		}
	}
	var p = {};
	p.utf8 = utf8;
	p.other = new Buffer(other);
	return p;
}

vows.describe("CP949 tests").addBatch({
	"Vows is working": function() {},
	"CP949 correctly encoded/decoded": function() {
		assert.strictEqual(iconv.toEncoding(testStringUtf, "cp949").toString("binary"), testStringCP949Buffer.toString("binary"));
		assert.strictEqual(iconv.fromEncoding(testStringCP949Buffer, "cp949"), testStringUtf);
	},
	"ks_c_5601-1987 correctly encoded/decoded": function() {
		assert.strictEqual(iconv.toEncoding(testStringUtf, "ks_c_5601-1987").toString("binary"), testStringCP949Buffer.toString("binary"));
		assert.strictEqual(iconv.fromEncoding(testStringCP949Buffer, "ks_c_5601-1987"), testStringUtf);
	},

	"compare with iconv result": function() {
		var mapfolder = path.join(path.dirname(module.filename), "../encodings/filemapping");
		var files = fs.readdirSync(mapfolder);
		var t;
		for (i=0; i<files.length; i++)
		{
			var x = files[i].indexOf(" ");
			if (x === -1) x = files[i].indexOf(".");
			var enc = files[i].substring(0, x);
			//console.log("Test encoding " + enc);
			var p = getBigText(path.join(mapfolder, files[i]));
	
			// compare iconv-lite with utf8
			assert.strictEqual(iconv.fromEncoding(p.other, enc).toString(), p.utf8);
	
			// compare iconv with utf8
			var iconvc = new (require("iconv").Iconv)(enc, "utf8");
			assert.strictEqual(iconvc.convert(p.other).toString(), p.utf8);
		}
	},
}).export(module)
