const Automerge = require('automerge');
const uuid = require('uuid');
const redis =require('redis');

const uuidv4 = uuid.v4

/**
 * REDIS config
 */
const redisPort = 6379;
const redisPassword = "2020coronavirus2020";
//////////

const redisClient = redis.createClient({
  port: redisPort,
  host: "10.128.0.17",
  password: redisPassword
});

redisClient.on('error', err => {
  console.log('Error: ' + err);
});

redisClient.on('connect', () => {
  console.info('Redis client connected');
});

// todos = Automerge.from(todos)

async function getTodo(params) {
    const method = params.__ow_method

    todos = await new Promise((resolve, reject) => { redisClient.get('todos', (err,res) => {
        if (err) {
            resolve(Automerge.from({}));
          } else {
            resolve(JSON.parse(res));
          }
    })});

    setTodosInCache = async (todos) =>{
        await new Promise((resolve, reject) => { redisClient.set('todos',todos, (err,res) => {
            if (err) {
                console.log("it is a disaster...")
                reject();
              } else {
                resolve();
              }
        })});
    }

    if (method == 'get') {
        //check if redisclient is null or undefined
        return {
            body:{ 
                todo: todos,
                statusCode: 200
            }
        }
    }
    else if (method == 'post') {
        const user_id = params.user_id;
        const description = params.description;
        const done = params.done;
        const task_id = uuidv4();
        let todo = {
            'id' : task_id,
            'description': description,
            'done': done
        }
        todos = Automerge.change(todos, 'Add Todo', todos => {
            if (todos.hasOwnProperty(user_id)) {
                todos[user_id].push(todo)
            } else {
                todos[user_id] = []
                todos[user_id].push(todo)
            }  
        });
        
        //update in cache...should be blocking.......
        setTodosInCache(todos);

        return {
            body: {
                task_id: task_id
            },
            statusCode: 200
        }
    }
    else if (method == 'delete') {
        let path = params.__ow_path.split('/');
        const user_id = path[1]
        const task_id = path[2]
        // return {
        //     body: {
        //         Response: 'Nothing to delete',
        //         user_id: user_id,
        //         task_id: task_id
        //     },
        //     statusCode: 200
        // }
        if (todos.hasOwnProperty(user_id)) {
            const deleteIndex = todos[user_id].findIndex( ({ id }) => id == task_id );
            if (deleteIndex != -1) {
                todos = Automerge.change(todos, 'Delete Todo', todos => {
                    todos = todos[user_id].splice(deleteIndex, 1)
                });
                //update in cache...should be blocking.......
                setTodosInCache(todos);
                return {
                    body: {
                        Response: todos[user_id]
                    },
                    statusCode: 200
                }
            } else {
                return {
                    body: {
                        Response: 'Nothing to delete'
                    },
                    statusCode: 200
                }
            }
        } else {
            return {
                body: {
                    Error: 'Bad Request'
                },
                statusCode: 400
            }

        }
    }
    else  if (method == 'put') {
        let path = params.__ow_path.split('/');
        const user_id = path[1]
        const task_id = path[2]
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
            const updateIndex = todos[user_id].findIndex( ({ id }) => id == task_id );
            if (updateIndex != -1) {
                todos = Automerge.change(todos, 'Update Todo', todos => {
                    if (params.hasOwnProperty('description')) {
                        todos[user_id][updateIndex].description = params.description
                    }
                    if (params.hasOwnProperty('done')) {
                        todos[user_id][updateIndex].done = params.done
                    }
                });

                //update in cache...should be blocking.......
                setTodosInCache(todos);

                return {
                    body: {
                        Response: todos[user_id][updateIndex]
                    },
                    statusCode: 200
                }
            } else {
                return {
                    body: {
                        Response: 'Nothing to update'
                    },
                    statusCode: 200
                }
            }
        } else {
            return {
                body: {
                    Error: 'Bad Request'
                },
                statusCode: 400
            }

        }
    }
}

exports.main = getTodo