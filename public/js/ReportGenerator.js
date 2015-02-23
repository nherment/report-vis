(function($) {

function ReportGenerator() {
}

ReportGenerator.run = function(performanceReports, callback) {

  this._generateAggregatedReport(performanceReports, function(err, performanceReports) {
    callback(err, performanceReports)
  })
}


ReportGenerator._generateAggregatedReport = function(performanceReports, callback) {

  // the combined report for all URLs with aggregated results for each metric 
  var combinedReport = {}
  
  _.each(performanceReports, function(perfReport) {

    if(perfReport && perfReport.rawData) {
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

$.ReportGenerator = ReportGenerator;
  

})(jQuery)
