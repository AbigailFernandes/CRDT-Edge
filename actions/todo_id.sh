npm install
zip -r action.zip *
wsk package create ds
# wsk action create ds/todo --kind nodejs:10 action.zip --web true
wsk action update ds/todo --kind nodejs:10 action.zip --web true
wsk action get ds/todo --url