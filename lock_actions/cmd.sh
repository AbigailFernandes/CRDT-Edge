../start_redis.sh
sudo npm install
zip -r action.zip *
wsk -i action delete todo
wsk -i action create todo --kind nodejs:10 action.zip --web true
wsk -i action get todo --url
wsk -i api create /api/todo get todo --apiname "todo"
wsk -i api create /api/todo post todo --apiname "todo"
wsk -i api create /api/todo delete todo --apiname "todo"
wsk -i api create /api/todo put todo --apiname "todo"
