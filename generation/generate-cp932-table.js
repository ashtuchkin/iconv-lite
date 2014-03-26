var http = require('http');
var fs = require('fs');
// CP932

var cp932 = {host:'www.unicode.org',path:'/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP932.TXT'};

http.get(cp932, function(res) {
  var data = '';
  res.on('data', function(chunk) {
    data += chunk;
  });
  res.on('end', function() {
    var table = {};
    data = data.split('\n').slice(1);
    data.forEach(function(line, idx) {
      console.log('line', line);
      var pair = line.split('\t');
      console.log('pair', pair);
      var key = parseInt(pair[0]);
      var val = parseInt(pair[1]);
      table[key] = val;
    });
    fs.writeFileSync('encodings/table/cp932.js',
    	'module.exports = ' + JSON.stringify(table) + ';');
  });
});
