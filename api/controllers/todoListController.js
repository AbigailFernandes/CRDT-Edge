import { v4 as uuidv4 } from 'uuid';
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
    todos[user_id].push(todo)
    res.json({
        'task_id' : task_id
    })
}
 
// get all todo items from the database
export function getAllTodos(req, res) {
    console.log('GET ALL called')
    res.json(todos)
}
 
// get single user's todo list based on the id
export function getTodo(req, res) {
    console.log('Get by id called' + req.params.user_id)
    res.json(todos[req.params.user_id])
}
 
// update the user's to do information information based on id
export function updateTodo(req, res) {
    console.log('Update TODO called' + req.params.user_id)
    let todo_list = todos[req.params.user_id]
    let update = req.body
    for(let i = 0; i < todo_list.length; i++) {
        if(todo_list[i].id == req.params.task_id) {
            todo_list[i].description = update.description
            todo_list[i].done = update.done
            break
        }
    }
    res.json('Done')
}
 
// delete the todo item from the database.
export function deleteTodo(req, res) {
    console.log('Delete Todo called, user_id: ' + req.params.user_id + ' ,task_id: ' + req.params.item_id)
    let indexToDelete = -1
    let todo_list = todos[req.params.user_id]
    for(let i = 0; i < todo_list.length; i++) {
        if (todo_list[i].id == req.params.task_id) {
            indexToDelete = i
            break
        }
    }
    if(indexToDelete != -1) {
        todo_list = todo_list.splice(indexToDelete, 1)
    }
    res.json('Delete Todo called, user_id: ' + req.params.user_id + ' ,task_id: ' + req.params.item_id)
}

export function mergeState(req, res) {
    console.log('Merge State called')
    res.json('Merge State called')

}