var gbkTable = require(__dirname + '/table/gbk.js');
module.exports = {
	'gb2312': 'gbk',
	'gbk': {
		type: 'table',
		table: gbkTable
	}
}
