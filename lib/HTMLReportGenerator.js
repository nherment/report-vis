
var fs = require('fs')
var wrench = require('wrench')
var dust = require('dustjs-linkedin')

var templateDirectory = __dirname + '/../html-templates'

var reportIndexTemplate = fs.readFileSync(templateDirectory + '/index.html', 'utf8')

var compiled = dust.compile(reportIndexTemplate, 'index')
dust.loadSource(compiled)

function HTMLReportGenerator() {

}

HTMLReportGenerator.generate = function(targetDirectory, metrics, callback) {
  
  dust.render('index', {metrics: metrics}, function(err, out) {
    if(err) {
      callback(err)
    } else {
      wrench.copyDirSyncRecursive(templateDirectory, targetDirectory, {
        forceDelete: false
      })
      var reportFilePath = targetDirectory + '/index.html'
      fs.writeFileSync(reportFilePath, out, 'utf8')
      console.log('Report generated at', reportFilePath)
      callback()
    }
  })
  
}


module.exports = HTMLReportGenerator
