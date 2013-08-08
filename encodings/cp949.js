var fs = require('fs');

function loadTable() {
	var cp949Table = {};
	var f = fs.readFileSync(require.resolve('./table/cp949.txt'), 'utf8');
	var i;
	var line;
	var lines = f.split('\n');
	var col;
	for (i=0; i<lines.length; i++)
	{
		line = lines[i];
		if ((line) && (line.charAt(0) !== '#'))
		{
			col = line.split('\t');
			if (col[1].trim() !== "") cp949Table[parseInt(col[0],16)] = parseInt(col[1],16);
		}
	}
	return cp949Table;
}

module.exports = {
	'ks_c_56011987': 'cp949',
	'cp949': {
		type: 'table',
		table: loadTable()
	}
}
