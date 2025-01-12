"use client";

import { useAnalytics } from "@cassini/analytics/next";
import { useState } from "react";
import { addTodo } from "../actions";

export function AddTodo() {
  const [text, setText] = useState("");
  const analytics = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    analytics.track({
      name: "todo_form_submitted",
      properties: {
        textLength: text.length,
      },
    });

    await addTodo(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Todo
        </button>
      </div>
    </form>
  );
}
