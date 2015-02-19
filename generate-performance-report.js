var argv = require('optimist').argv


if(!argv.source) {
  argv.source = __dirname + '/../performance_data'
}

if(!argv.output) {
  argv.output = __dirname + '/../generated_reports'
}

var ReportGenerator = require('./lib/ReportGenerator.js')
ReportGenerator.run({
  source: argv.source,
  output: argv.output
}, function(err) {
  if(err) throw err
})
