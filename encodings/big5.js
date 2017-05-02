var fs = require('fs');
var table = require(__dirname + '/table/cp950.js');

module.exports = {
  'big5': 'big5',
  'big5': {
     type: 'table',
     table: table
  }
}
