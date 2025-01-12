"use client";

import { useAnalytics } from "@cassini/analytics/next";
import { useTransition } from "react";
import type { Todo } from "../types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
}

export function TodoItem({ todo, onToggle }: TodoItemProps) {
  const [isPending, startTransition] = useTransition();
  const analytics = useAnalytics();

  const handleClick = () => {
    analytics.track({
      name: "todo_checkbox_clicked",
      properties: {
        todoId: todo.id,
        newState: !todo.completed,
      },
    });

    startTransition(() => onToggle(todo.id));
  };

  return (
    <li
      className={`p-4 border rounded flex items-center gap-4 ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleClick}
        className="h-5 w-5"
      />
      <span className={todo.completed ? "line-through text-gray-500" : ""}>
        {todo.text}
      </span>
    </li>
  );
}
