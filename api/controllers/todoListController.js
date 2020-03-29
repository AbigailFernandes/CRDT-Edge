import { v4 as uuidv4 } from 'uuid';
import request from 'request';
import fs from 'fs'

const Automerge = require('automerge')
let todos = {
    'abigail':[
        {
            'id': 1,
            'description': 'Complete everything',
            'done' : 'False'
        },
        {
            'id': 2,
            'description': 'Talk to Sanchit',
            'done' : 'False'
        }
    ],
    'biljith': [
        {
            'id': 1,
            'description': 'Learn JavaScript',
            'done' : 'False'
        },
        {
            'id': 2,
            'description': 'Code the endpoints',
            'done' : 'False'
        }
    ]
}
let doc = Automerge.from(todos)
let contents = fs.readFileSync('config.json', 'utf8');
let addresses = JSON.parse(contents);
console.log(addresses)


// add new todo item to the database
export function addNewTodo(req, res) {
    console.log('POST called')
    const user_id = req.body.user_id
    const description = req.body.description
    const done = req.body.done
    const task_id = uuidv4()
    let todo = {
        'id' : task_id,
        'description': description,
        'done': done
    }
    console.log(user_id)
    doc = Automerge.change(doc, 'Add Todo', doc => {
        if (doc.hasOwnProperty('user_id')) {
            doc[user_id].push(todo)
        } else {
            doc[user_id] = []
            doc[user_id].push(todo)
        }   
    })
    res.json({
        'task_id' : task_id
    });
    broadcast(doc);
}
 
// get all todo items from the database
export function getAllTodos(req, res) {
    console.log('GET ALL called')
    res.json(doc)
}
 
// get single user's todo list based on the id
export function getTodo(req, res) {
    console.log('Get by id called' + req.params.user_id)
    res.json(doc[req.params.user_id])
}
 
// update the user's to do information information based on id
export function updateTodo(req, res) {
    console.log('Update TODO called' + req.params.user_id)
    // let todo_list = todos[req.params.user_id]
    let update = req.body
    for(let i = 0; i < doc[req.params.user_id].length; i++) {
        if(doc[req.params.user_id][i].id == req.params.task_id) {
            doc = Automerge.change(doc, 'Update Todo', doc => {
                doc[req.params.user_id][i].description = update.description
                doc[req.params.user_id][i].done = update.done
            })
            break
        }
    }
    res.json('Done')
    broadcast(doc)
}
 
// delete the todo item from the database.
export function deleteTodo(req, res) {
    console.log('Delete Todo called, user_id: ' + req.params.user_id + ' ,task_id: ' + req.params.item_id)
    let indexToDelete = -1
    for(let i = 0; i < doc[req.params.user_id].length; i++) {
        if (doc[req.params.user_id][i].id == req.params.task_id) {
            indexToDelete = i
            break
        }
    }
    if(indexToDelete != -1) {
        doc = Automerge.change(doc, 'Delete Todo', doc => {
            // Not sure if the doc has to be changed in-place. Need to test
            doc = doc[req.params.user_id].splice(indexToDelete, 1)
        });
    }
    res.json('Delete Todo called, user_id: ' + req.params.user_id + ' ,task_id: ' + req.params.item_id)
    broadcast(doc);
}

export function mergeState(req, res) {
    console.log('Merge State called')
    console.log(req.body)
    let merge_doc = Automerge.from(req.body)
    doc = Automerge.merge(doc, merge_doc)
    res.json('Merge State called')
}

function broadcast(data) {
    console.log(data)
    addresses['servers'].forEach(address => {
        const path_name = `http://${address['ip']}:${address['port']}/merge`
        request.post(path_name, {
            json: data
          }, (error, res, body) => {
            if (error) {
              console.error(error)
              return
            }
            console.log(`statusCode: ${res.statusCode}`)
            console.log(body)
          })
    });
}