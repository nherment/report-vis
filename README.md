

Report visualization for website performance metrics (from phamtomas)

# Quickstart

``
  make
``

# Usage

Generate the performance data:

``
  phantomas https://www.mycs.com --reporter=json --runs 10 --engine=webkit > performance_data/mycs.com.json
	phantomas https://www.mycs.io --reporter=json --runs 10 --engine=webkit > performance_data/mycs.io.json
``

Generate a HTML website to view the results:

``
	node generate-performance-report.js --source performance_data --output generated-reports
``

node generate-performance-report.js --source performance_data --output generated-reports