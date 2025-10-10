import React, { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import axios from "axios";

interface Message { id: string; role: "user" | "assistant"; content: string }

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    const resp = await axios.post("/api/ai/chat", { message: userMsg.content });
    const assistant: Message = { id: crypto.randomUUID(), role: "assistant", content: resp.data.content };
    setMessages((m) => [...m, assistant]);
  }

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("image", file);
    const resp = await axios.post("/api/ai/vision", form, { headers: { "Content-Type": "multipart/form-data" } });
    const assistant: Message = { id: crypto.randomUUID(), role: "assistant", content: `OCR/Caption: ${resp.data.ocrText || ""}\n\n${resp.data.text || ""}` };
    setMessages((m) => [...m, assistant]);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.role === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-blue-600" : "bg-neutral-800"}`}>
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-neutral-800 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Envie uma mensagem..."
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm"
        />
        <button onClick={send} className="bg-blue-600 hover:bg-blue-500 px-4 rounded text-sm">Enviar</button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onImage} className="hidden" />
        <button onClick={() => fileRef.current?.click()} className="bg-neutral-800 px-3 rounded text-sm">Imagem</button>
      </div>
    </div>
  );
};
