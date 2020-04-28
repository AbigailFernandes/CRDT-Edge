const Automerge = require("automerge");
const uuid = require("uuid");
const redis = require("redis");
const fs = require("fs");
const request = require("request");
const Redlock = require("redlock");

const uuidv4 = uuid.v4;

/**
 * REDIS config
 */
const redisPort = 6380;
const redisPassword = "2020coronavirus2020";
//////////

const redisClient = redis.createClient({
  port: redisPort,
  host: "10.128.0.27",
  password: redisPassword,
});

var redlock = new Redlock(
  // you should have one client for each independent redis node
  // or cluster
  [redisClient],
  {
    // the expected clock drift; for more details
    // see http://redis.io/topics/distlock
    driftFactor: 0.01, // time in ms

    // the max number of times Redlock will attempt
    // to lock a resource before erroring
    retryCount: 10,

    // the time in ms between attempts
    retryDelay: 100, // time in ms

    // the max time in ms randomly added to retries
    // to improve performance under high contention
    // see https://www.awsarchitectureblog.com/2015/03/backoff.html
    retryJitter: 100, // time in ms
  }
);

redlock.on("clientError", function (err) {
  console.error("A redis error has occurred:", err);
});

function broadcast(data) {
  let contents = fs.readFileSync("config.json", "utf8");
  let addresses = JSON.parse(contents);
  addresses["servers"].forEach((address) => {
    const path_name = `${address["url"]}/${address["endpoint"]}/merge`;
    request.post(
      path_name,
      {
        json: data,
      },
      (error, res, body) => {
        if (error) {
          console.error(error);
          return;
        }
      }
    );
  });
}

function getTodo(params) {
  const method = params.__ow_method;
  const path = params.__ow_path;

  // the string identifier for the resource you want to lock
  var resource = "locks:todos";
  var ttl = 1000;
  response = async () =>
    await new Promise(resolve, (reject) => {
      redlock.lock(resource, ttl).then(function (lock) {
        setTodosInCache = async (todos) => {
          await new Promise((resolve, reject) => {
            redisClient.set("todos", todos, (err, res) => {
              if (err) {
                console.log("it is a disaster...");
                reject();
              } else {
                console.log("Updating finally in Redis");
                resolve();
              }
            });
          });
        };

        geTodosFromRedis = async () =>
          await new Promise((resolve, reject) => {
            redisClient.get("todos", (err, res) => {
              if (err) {
                console.log(
                  "Got an error from redis...creating and broadcast Error:",
                  err
                );
                doc = Automerge.init("1234-abcd-56789-qrstuv");
                setTodosInCache(Automerge.save(doc));
                reject(doc);
              } else {
                if (res == null) {
                  console.log("Got a null from redis...creating and broadcast");
                  doc = Automerge.init("1234-abcd-56789-qrstuv");
                  setTodosInCache(Automerge.save(doc));
                  resolve(doc);
                } else resolve(Automerge.load(res));
              }
            });
          });

        todos = geTodosFromRedis();

        // Merge endpoint
        if (path == "/merge") {
          let changes = JSON.parse(params.__ow_body);
          console.log(typeof todos);
          console.log(todos);
          console.log(changes.body);
          todos = Automerge.applyChanges(todos, changes.body);
          console.log(todos);
          setTodosInCache(Automerge.save(todos));
          console.log("Merge triggered");
          lock.unlock().catch(function (err) {
            console.error("Unlocking the resource", err);
          });
          resolve({
            statusCode: 200,
          });
        }

        if (method == "get") {
          //check if redisclient is null or undefined
          lock.unlock().catch(function (err) {
            console.error("Unlocking the resource", err);
          });
          resolve({
            body: {
              todo: todos,
            },
            statusCode: 200,
          });
        } else if (method == "post") {
          const user_id = params.user_id;
          const description = params.description;
          const done = params.done;
          const task_id = uuidv4();
          let todo = {
            id: task_id,
            description: description,
            done: done,
          };
          new_todos = Automerge.change(todos, "Add Todo", (todos) => {
            if (todos.hasOwnProperty(user_id)) {
              todos[user_id].push(todo);
            } else {
              todos[user_id] = [];
              todos[user_id].push(todo);
            }
          });
          let changes = Automerge.getChanges(todos, new_todos);
          todos = new_todos;
          broadcast({
            body: changes,
          });

          //update in cache...should be blocking.......
          setTodosInCache(Automerge.save(todos));
          lock.unlock().catch(function (err) {
            console.error("Unlocking the resource", err);
          });
          resolve({
            body: {
              task_id: task_id,
            },
            statusCode: 200,
          });
        } else if (method == "delete") {
          let path = params.__ow_path.split("/");
          const user_id = path[1];
          const task_id = path[2];
          // return {
          //     body: {
          //         Response: 'Nothing to delete',
          //         user_id: user_id,
          //         task_id: task_id
          //     },
          //     statusCode: 200
          // }
          if (todos.hasOwnProperty(user_id)) {
            const deleteIndex = todos[user_id].findIndex(
              ({ id }) => id == task_id
            );
            if (deleteIndex != -1) {
              new_todos = Automerge.change(todos, "Delete Todo", (todos) => {
                todos = todos[user_id].splice(deleteIndex, 1);
              });
              let changes = Automerge.getChanges(todos, new_todos);
              todos = new_todos;
              broadcast({
                body: changes,
              });
              //update in cache...should be blocking.......
              setTodosInCache(Automerge.save(todos));
              lock.unlock().catch(function (err) {
                console.error("Unlocking the resource", err);
              });
              resolve({
                body: {
                  Response: todos[user_id],
                },
                statusCode: 200,
              });
            } else {
              lock.unlock().catch(function (err) {
                console.error("Unlocking the resource", err);
              });
              resolve({
                body: {
                  Response: "Nothing to delete",
                },
                statusCode: 200,
              });
            }
          } else {
            lock.unlock().catch(function (err) {
              console.error("Unlocking the resource", err);
            });
            resolve({
              body: {
                Error: "Bad Request",
              },
              statusCode: 400,
            });
          }
        } else if (method == "put") {
          let path = params.__ow_path.split("/");
          const user_id = path[1];
          const task_id = path[2];
          // return {
          //     body: {
          //         Response: 'Nothing to delete',
          //         user_id: user_id,
          //         task_id: task_id,
          //         description: params.description,
          //         done: params.done
          //     },
          //     statusCode: 200
          // }
          if (todos.hasOwnProperty(user_id)) {
            const updateIndex = todos[user_id].findIndex(
              ({ id }) => id == task_id
            );
            if (updateIndex != -1) {
              new_todos = Automerge.change(todos, "Update Todo", (todos) => {
                if (params.hasOwnProperty("description")) {
                  todos[user_id][updateIndex].description = params.description;
                }
                if (params.hasOwnProperty("done")) {
                  todos[user_id][updateIndex].done = params.done;
                }
              });

              let changes = Automerge.getChanges(todos, new_todos);
              todos = new_todos;
              broadcast({
                body: changes,
              });

              //update in cache...should be blocking.......
              setTodosInCache(Automerge.save(todos));
              lock.unlock().catch(function (err) {
                console.error("Unlocking the resource", err);
              });
              resolve({
                body: {
                  Response: todos[user_id][updateIndex],
                },
                statusCode: 200,
              });
            } else {
              lock.unlock().catch(function (err) {
                console.error("Unlocking the resource", err);
              });
              resolve({
                body: {
                  Response: "Nothing to update",
                },
                statusCode: 200,
              });
            }
          } else {
            lock.unlock().catch(function (err) {
              console.error("Unlocking the resource", err);
            });
            resolve({
              body: {
                Error: "Bad Request",
              },
              statusCode: 400,
            });
          }
        }
      });
    });
  return response();
}

exports.main = getTodo;
