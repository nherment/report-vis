var express = require('express')
var serveStatic = require('serve-static')
var _ = require('lodash')
var path = require('path')

var ReportFetcher = require('./lib/ReportFetcher.js')

var app = express()

app.use(serveStatic('public'))

app.get('/api/reports', function(req, res) {
  ReportFetcher.fetchPerformanceReports(__dirname + '/performance_data', function(err, reports) {
    if(err) {
      res.status(500).send(err)
    } else {
      res.send(reports)
    }
  })
})

app.get(/^.*/, function(req, res) {
  res.sendFile(path.normalize(__dirname + '/public/index.html'))
})

var PORT = process.env.PORT || 8000

app.listen(PORT, function(err) {
  if(err) throw err
  console.log('Listening on port', PORT)
})
