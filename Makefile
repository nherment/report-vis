
all: run-performance-tests run

run-performance-tests:
	node_modules/.bin/phantomas https://www.mycs.com --reporter=json --runs 10 --engine=webkit > performance_data/mycs.com.json
	node_modules/.bin/phantomas https://www.mycs.io --reporter=json --runs 10 --engine=webkit > performance_data/mycs.io.json

run:
	node server.js

.PHONY: all run-performance-tests run
