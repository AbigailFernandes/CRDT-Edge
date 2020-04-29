const Automerge = require("automerge");
const uuid = require("uuid");
const redis = require("redis");
const fs = require("fs");
const request = require("request");
const Redlock = require("redlock");
const bluebird = require("bluebird");

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

async function getTodo(params) {
  const method = params.__ow_method;
  const path = params.__ow_path;

  // the string identifier for the resource you want to lock
  var resource = "locks:todos";
  var ttl = 1000;
  bluebird.promisifyAll(redis.RedisClient.prototype);
  bluebird.promisifyAll(redis.Multi.prototype);

  var result = redlock.lock(resource, ttl).then(async function (lock) {
    async function geTodosFromRedis(key) {
      let response = await redisClient.getAsync(key);
      if (response == null) {
        console.log("Got a null from redis...creating and broadcast");
        doc = Automerge.init("1234-abcd-56789-qrstuv");
        await redisClient.setAsync("todos", Automerge.save(doc));
        console.log("Shreshtha - Done inserting fresh document in redis");
        return doc;
      } else {
        console.log(
          "Shreshtha - Got saved todos in redis ",
          Automerge.load(response)
        );
        return Automerge.load(response);
      }
    }

    var todos = await geTodosFromRedis("todos");
    console.log("Shreshtha - Got todos from redis: ", rr);

    // Merge endpoint
    if (path == "/merge") {
      let changes = JSON.parse(params.__ow_body);
      console.log(typeof todos);
      console.log(todos);
      console.log(changes.body);
      todos = Automerge.applyChanges(todos, changes.body);
      console.log(todos);
      // setTodosInCache(Automerge.save(todos));
      await redisClient.setAsync("todos", Automerge.save(todos));

      console.log("Merge triggered");
      lock.unlock().catch(function (err) {
        console.error("Unlocking the resource", err);
      });
      return {
        statusCode: 200,
      };
    }

    if (method == "get") {
      //check if redisclient is null or undefined
      lock.unlock().catch(function (err) {
        console.error("Unlocking the resource", err);
      });
      return {
        body: {
          todo: todos,
        },
        statusCode: 200,
      };
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
      // setTodosInCache(Automerge.save(todos));
      await redisClient.setAsync("todos", Automerge.save(todos));

      result = lock.unlock().catch(function (err) {
        console.error("Unlocking the resource", err);
      });
      return {
        body: {
          task_id: task_id,
        },
        statusCode: 200,
      };
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
        const deleteIndex = todos[user_id].findIndex(({ id }) => id == task_id);
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
          // setTodosInCache(Automerge.save(todos));
          await redisClient.setAsync("todos", Automerge.save(todos));

          lock.unlock().catch(function (err) {
            console.error("Unlocking the resource", err);
          });
          return {
            body: {
              Response: todos[user_id],
            },
            statusCode: 200,
          };
        } else {
          lock.unlock().catch(function (err) {
            console.error("Unlocking the resource", err);
          });
          return {
            body: {
              Response: "Nothing to delete",
            },
            statusCode: 200,
          };
        }
      } else {
        lock.unlock().catch(function (err) {
          console.error("Unlocking the resource", err);
        });
        return {
          body: {
            Error: "Bad Request",
          },
          statusCode: 400,
        };
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
        const updateIndex = todos[user_id].findIndex(({ id }) => id == task_id);
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
          // setTodosInCache(Automerge.save(todos));
          await redisClient.setAsync("todos", Automerge.save(todos));

          lock.unlock().catch(function (err) {
            console.error("Unlocking the resource", err);
          });
          return {
            body: {
              Response: todos[user_id][updateIndex],
            },
            statusCode: 200,
          };
        } else {
          lock.unlock().catch(function (err) {
            console.error("Unlocking the resource", err);
          });
          return {
            body: {
              Response: "Nothing to update",
            },
            statusCode: 200,
          };
        }
      } else {
        lock.unlock().catch(function (err) {
          console.error("Unlocking the resource", err);
        });
        return {
          body: {
            Error: "Bad Request",
          },
          statusCode: 400,
        };
      }
    }
  });
  return result;
}

exports.main = getTodo;
