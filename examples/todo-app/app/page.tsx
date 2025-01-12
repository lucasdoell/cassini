import { AddTodo } from "./components/add-todo";
import { TodoList } from "./components/todo-list";

export default async function Home() {
  // Server-side page view tracking happens automatically

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Todo App</h1>
      <AddTodo />
      <TodoList />
    </main>
  );
}
