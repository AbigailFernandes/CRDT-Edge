
// add new todo item to the database
export function addNewTodo(req, res) {
    console.log('POST called')
    res.json('POST called')
}
 
// get all todo items from the database
export function getAllTodos(req, res) {
    console.log('GET ALL called')
    res.json('GET ALL called')
}
 
// get single user's todo list based on the id
export function getTodo(req, res) {
    console.log('Get by id called' + req.params.user_id)
    res.json('Get by id called' + req.params.user_id)
}
 
// update the user's to do information information based on id
export function updateTodo(req, res) {
    console.log('Update TODO called' + req.params.user_id)
    res.json('Update TODO called' + req.params.user_id)
}
 
// delete the todo item from the database.
export function deleteTodo(req, res) {
    console.log('Delete Todo called, user_id: ' + req.params.user_id + ' ,task_id: ' + req.params.item_id)
    res.json('Delete Todo called, user_id: ' + req.params.user_id + ' ,task_id: ' + req.params.item_id)
}

export function mergeState(req, res) {
    console.log('Merge State called')
    res.json('Merge State called')

}