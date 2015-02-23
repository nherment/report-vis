

Report visualization for website performance metrics (from phamtomas)

# Quickstart

```
  npm install
  make
```

# Usage

Generate the performance data:

```
  phantomas https://www.mycs.com --reporter=json --runs 10 --engine=webkit > performance_data/mycs.com.json
	phantomas https://www.mycs.io --reporter=json --runs 10 --engine=webkit > performance_data/mycs.io.json
```

Serve a HTML website to view the results:

```
	node server.js
```