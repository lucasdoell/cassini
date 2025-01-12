import { getTodos, toggleTodo } from "../actions";
import { TodoItem } from "./todo-item";

export async function TodoList() {
  const todos = await getTodos();

  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
      ))}
      {todos.length === 0 && (
        <li className="text-gray-500">No todos yet. Add one above!</li>
      )}
    </ul>
  );
}
