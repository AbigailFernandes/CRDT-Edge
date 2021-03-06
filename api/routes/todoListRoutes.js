
import { getAllTodos, addNewTodo, getTodo, updateTodo, deleteTodo, mergeState } from '../controllers/todoListController';
 
const routes = (app) => {
    app.route('/todo')
        .get(getAllTodos)
        .post(addNewTodo)

    app.route('/todo/:user_id')
        .get(getTodo)
 
    app.route('/todo/:user_id/:task_id')
        .put(updateTodo)
        .delete(deleteTodo)

    app.route('/merge')
        .post(mergeState)
}
 
export default routes