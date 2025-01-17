"use server";

import { track } from "@cassini/analytics/next/server";
import { createStructuredLogger } from "@cassini/observability";
import { Span, withSpan } from "@cassini/observability/next";
import { revalidatePath } from "next/cache";
import { Todo } from "./types";

let todos: Todo[] = [];

const logger = createStructuredLogger({
  serviceName: "todo-app",
});

export async function withTodoSpan<T>({
  operationName,
  attributes,
  operation,
}: {
  operationName: string;
  attributes?: Record<string, string | number | boolean>;
  operation: (span: Span) => Promise<T>;
}): Promise<T> {
  return withSpan({
    serviceName: "todo-app",
    activeSpanName: operationName,
    attributes,
    operation,
  });
}

export async function addTodo(text: string) {
  withTodoSpan({
    operationName: "add_todo",
    attributes: { "todo.text": text },
    operation: async (span) => {
      const todo = {
        id: Math.random().toString(36).substring(7),
        text,
        completed: false,
      };

      todos.push(todo);
      revalidatePath("/");

      span.setAttribute("todo.id", todo.id);

      await track("todo_added", {
        todoId: todo.id,
        todoText: text,
      });

      await logger.info("Todo added", { todoId: todo.id, todoText: text });

      return todo;
    },
  });
}

export async function toggleTodo(id: string) {
  withTodoSpan({
    operationName: "toggle_todo",
    attributes: { "todo.id": id },
    operation: async (span) => {
      const todo = todos.find((t) => t.id === id);
      if (todo) {
        todo.completed = !todo.completed;
        revalidatePath("/");

        span.setAttribute("todo.completed", todo.completed);

        await track("todo_toggled", {
          todoId: id,
          completed: todo.completed,
        });

        await logger.info("Todo toggled", {
          todoId: id,
          completed: todo.completed,
        });
      }
    },
  });
}

export async function getTodos(): Promise<Todo[]> {
  return withTodoSpan({
    operationName: "get_todos",
    operation: async (span: Span) => {
      span.setAttribute("todos.count", todos.length);

      await logger.info("Todos retrieved", { todosCount: todos.length });
      return todos;
    },
  });
}
