
all: run-performance-tests generate-performance-report

generate-performance-report:
	node generate-performance-report.js --source performance_data --output generated-reports

run-performance-tests:
	node_modules/.bin/phantomas https://www.mycs.com --reporter=json --runs 10 --engine=webkit > performance_data/mycs.com.json
	node_modules/.bin/phantomas https://www.mycs.io --reporter=json --runs 10 --engine=webkit > performance_data/mycs.io.json

.PHONY: all install run-performance-tests generate-performance-report
