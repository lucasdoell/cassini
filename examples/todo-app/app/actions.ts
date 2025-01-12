"use server";

import { track } from "@cassini/analytics/next/server";
import { revalidatePath } from "next/cache";
import { Todo } from "./types";

let todos: Todo[] = [];

export async function addTodo(text: string) {
  const todo = {
    id: Math.random().toString(36).substring(7),
    text,
    completed: false,
  };

  todos.push(todo);
  revalidatePath("/");

  await track("todo_added", {
    todoId: todo.id,
    todoText: text,
  });

  return todo;
}

export async function toggleTodo(id: string) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    revalidatePath("/");

    await track("todo_toggled", {
      todoId: id,
      completed: todo.completed,
    });
  }
}

export async function getTodos(): Promise<Todo[]> {
  return todos;
}
