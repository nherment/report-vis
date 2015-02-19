
var fs = require('fs')
var _ = require('lodash')
var path = require('path')
var assert = require('assert')
var wrench = require('wrench')

var HTMLReportGenerator = require('./HTMLReportGenerator.js')

var DEBUG = process.env.DEBUG

function debug() {
  console.log.apply(console, arguments)
}

function ReportGenerator(options) {
  
  assert.ok(_.isString(options.source),
            'Expect mandatory source field to point to the directory ' +
            'containing the performance reports but got [' + options.source + ']')
  
  assert.ok(_.isString(options.output),
            'Expect mandatory output field to point to the directory ' + 
            'containing the performance reports but got [' + options.output + ']')
  
  this._source = normalizePath(options.source)
  this._output = normalizePath(options.output)
  
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

ReportGenerator.run = function(options, callback) {
  var reportGenerator = new ReportGenerator(options)
  reportGenerator.run(callback)
}

ReportGenerator.prototype.run = function(callback) {

  var self = this

  this._buildReport(function(err, report) {
    
    if(err) { return callback(err, undefined) }
    
    HTMLReportGenerator.generate(self._output, report, function(err) {
      callback(err)
    })
    
  })
  
}

ReportGenerator.prototype._buildReport = function(callback) {
  var self = this
  
  this._fetchPerformanceReports(this._source, function(err, performanceReports) {
    if(err) {return callback(err, undefined) }
             
    self._generateAggregatedReport(performanceReports, function(err, performanceReports) {
      
      //console.log('REPORTS', JSON.stringify(performanceReports, null, 2))
      callback(err, performanceReports)
    })
  })

}

ReportGenerator.prototype._generateAggregatedReport = function(performanceReports, callback) {

  // the combined report for all URLs with aggregated results for each metric 
  var combinedReport = {}
  
  _.each(performanceReports, function(perfReport) {

    
    if(perfReport.rawData) {
      var url = perfReport.url
      
      // start by calculating the aggregated result per website
      _.each(perfReport.rawData, function(singleRunResult) {
        
        _.each(singleRunResult, function(value, metricName) {

          if(typeof value !== 'number' || isNaN(value)) {
            //console.warn('Metric ignored because it is not a number', metricName, value)
            return
          }

          if(!combinedReport.hasOwnProperty(metricName)) {
            combinedReport[metricName] = {}
          }

          if(!combinedReport[metricName].hasOwnProperty(url)) {
            
            combinedReport[metricName][url] = {
              dataPoints: 1,
              average: value,
              sum: value,
              max: value,
              min: value
            }

          } else {

            var aggregatedData = combinedReport[metricName][url]
            
            aggregatedData.sum += value
            aggregatedData.max = Math.max(aggregatedData.max, value)
            aggregatedData.min = Math.min(aggregatedData.min, value)
            
            aggregatedData.dataPoints ++
            aggregatedData.average = aggregatedData.sum / aggregatedData.dataPoints
            
          }
          
        })
      })
        
      
    }
    
  })

  var combinedReportArr = []
  
  // combine each website data into one structure
  // to make the templating easier
  _.each(combinedReport, function(metricReport, metricName) {
    
    var min = {
      value: null
    }
    
    var max = {
      value: null
    }
    
    var allMinAreZeros = true
    var allMaxAreZeros = true
    
    _.each(metricReport, function(aggr, url) {
      
      allMinAreZeros = !aggr.min && allMinAreZeros

      if(min.value === null || aggr.min < min.value) {
        min.value = aggr.min
        min.url = url
        min.average = aggr.average
      } else if(min.value === aggr.min) {
        min.average = null
        min.url = 'both'
      }
      
      allMaxAreZeros = !aggr.max && allMaxAreZeros

      if(max.value === null || aggr.max > max.value) {
        max.value = aggr.max
        max.url = url
        max.average = aggr.average
      } else if(max.value === aggr.max) {
        max.average = null
        max.url = 'both'
      }
      
    })

    if(!allMinAreZeros || !allMaxAreZeros) {
      
      combinedReportArr.push({
        name: metricName,
        max: max,
        min: min
      })
    }
  })
  callback(undefined, combinedReportArr)
}


/** aggregates the various performance reports in one single array
  */
ReportGenerator.prototype._fetchPerformanceReports = function(sourcesDirectory, callback) {
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
  

module.exports = ReportGenerator
