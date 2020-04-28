../start_redis.sh
sudo npm install
zip -r action.zip *
wsk -i action delete todolock
wsk -i action create todolock --kind nodejs:10 action.zip --web true
wsk -i action get todolock --url
wsk -i api create /api/todolock get todolock --apiname "todolock"
wsk -i api create /api/todolock post todolock --apiname "todolock"
wsk -i api create /api/todolock delete todolock --apiname "todolock"
wsk -i api create /api/todolock put todolock --apiname "todolock"
