var cp949Table = {};

var fs = require('fs');
var f = fs.readFileSync(require.resolve('./table/cp949.txt'), 'utf8');
var i;
var line;
var lines = f.split('\n');
var col;
for (i=0; i<lines.length; i++)
{
	line = lines[i];
	if (line.charAt(0) !== '#')
	{
		col = line.split('\t');
		cp949Table[parseInt(col[0],16)] = parseInt(col[1],16);
		//cp949Table[parseInt(col[0],16)] = 51; // 3
	}
}

module.exports = {
	'ks_c_56011987': 'cp949',
	'cp949': {
		type: 'table',
		table: cp949Table
	}
}
