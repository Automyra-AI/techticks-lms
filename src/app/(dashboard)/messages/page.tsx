"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

const mockMessages = [
  { id: "1", sender: "Sarah Ahmed", role: "Trainer", content: "Great work on the Python assignment!", time: "2h ago", unread: true },
  { id: "2", sender: "Admin", role: "Admin", content: "Certificate requirements updated.", time: "1d ago", unread: false },
  { id: "3", sender: "Course Discussion", role: "Group", content: "Anyone stuck on REST APIs?", time: "2d ago", unread: false },
];

export default function MessagesPage() {
  const [selected, setSelected] = useState(mockMessages[0]);
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Messages</h2>
        <p className="text-zinc-400">Private chat, announcements, and course discussions</p>
      </div>

      <div className="grid h-[calc(100vh-220px)] gap-4 lg:grid-cols-3">
        <Card className="overflow-y-auto">
          <CardContent className="p-0">
            {mockMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelected(msg)}
                className={`w-full border-b border-zinc-800 p-4 text-left transition-colors hover:bg-zinc-900 ${
                  selected.id === msg.id ? "bg-violet-600/10" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-zinc-200">{msg.sender}</p>
                  {msg.unread && <span className="h-2 w-2 rounded-full bg-violet-500" />}
                </div>
                <p className="mt-1 truncate text-sm text-zinc-500">{msg.content}</p>
                <p className="mt-1 text-xs text-zinc-600">{msg.time}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="flex flex-col lg:col-span-2">
          <CardContent className="flex flex-1 flex-col p-4">
            <div className="mb-4 border-b border-zinc-800 pb-4">
              <p className="font-semibold text-zinc-100">{selected.sender}</p>
              <p className="text-xs text-zinc-500">{selected.role}</p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              <div className="max-w-[80%] rounded-lg bg-zinc-800 p-3">
                <p className="text-sm text-zinc-200">{selected.content}</p>
                <p className="mt-1 text-xs text-zinc-500">{selected.time}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
