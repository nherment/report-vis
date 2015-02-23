
var fs = require('fs')
var _ = require('lodash')
var path = require('path')
var assert = require('assert')
var wrench = require('wrench')

var DEBUG = process.env.DEBUG

function debug() {
  console.log.apply(console, arguments)
}

function ReportFetcher() {
}

/** returns the path untouched if absolute
  * or make the path absolute with the process' CWD as the relative reference
  */
function normalizePath(filePath) {
  if(isAbsolutePath(filePath)) {
    return path.normalize(filePath)
  } else {
    return path.normalize(process.cwd() + '/' + filePath)
  }
}

function isAbsolutePath(path) {
  return /^\//m.test(path)
}

/** aggregates the various performance reports in one single array
  */
ReportFetcher.fetchPerformanceReports = function(sourcesDirectory, callback) {
  sourcesDirectory = normalizePath(sourcesDirectory)
  
  debug('Fetching performance reports')
  var filePathsInPerformanceDirectory = wrench.readdirSyncRecursive(sourcesDirectory)

  debug('Found', filePathsInPerformanceDirectory.length, 'files in', sourcesDirectory)
  
  var performanceFiles = _.filter(filePathsInPerformanceDirectory, filePathHasJSONExtension)
  var performanceReports = []
  
  _.each(performanceFiles, function(filePath) {
    filePath = sourcesDirectory + '/'+ filePath
    var performanceReport = readJSONFile(filePath)
    if(performanceReport && performanceReport.runs && performanceReport.runs.length > 0) {
      debug('Adding performance file', filePath, 'to the report')
      var perfReport = {
        url: performanceReport.runs[0].url, // we assume that each file tests one website only
        rawData: _.pluck(performanceReport.runs, 'metrics')
      }
      performanceReports.push(perfReport)
    } else {
      console.warn('The performance file ['+filePath+'] is being ignored because it does not contain the necessary data')
    }
  })

  // we expose an async API so for good practice, we don't want to invoke the callback
  // synchronously
  setImmediate(function() {
    callback(undefined, performanceReports)
  })
}

function filePathHasJSONExtension(filePath) {
  var isJSON = /\.json$/i.test(filePath)
  if(!isJSON) {
    debug('File', filePath, 'is ignored because it does not have a JSON extension'); 
  }
  return isJSON
}

function readJSONFile(filePath) {
  
  try {
    var fileContent = fs.readFileSync(filePath, 'utf8')
  } catch(err) {
    // we are generating reports so this error is critical but not fatal
    // we do everything we can to generate report, even partial
    console.error('We could not open the performance report file at', filePath,
                  'The actual reason follows.')
    console.error(err)
    return null
  }
  
  try {
    var objectifiedContent = JSON.parse(fileContent)
    return objectifiedContent;
  } catch(err) {
    // we are generating reports so this error is critical but not fatal
    // we do everything we can to generate report, even partial
    console.error('The content of the file at', filePath,
                  'is expected to be JSON but could not be parsed. ' +
                  'Please check that this content is indeed valid JSON.')
    console.error(err)
    return null
  }
}
  

module.exports = ReportFetcher
