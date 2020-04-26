
for i in {1..5}; do
	curl --write-out '%{time_total}' http://10.128.0.17:9090/api/23bc46b1-71f6-4ed5-8c54-816aa4f8c502/api/todo
done
