import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    const { data } = await api.post("/api/ai/chat", { message: text, conversationId });
    const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: data.content };
    setMessages((m) => [...m, assistantMsg]);
    if (!conversationId) setConversationId(data.conversationId);
  }

  async function onPickImage(file: File) {
    const fd = new FormData();
    fd.append("image", file);
    const { data } = await api.post("/api/ai/vision", fd, { headers: { "Content-Type": "multipart/form-data" } });
    const combined = data.ocrText ? `${data.text}\n\nOCR:\n${data.ocrText}` : data.text;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: "[Imagem enviada]" };
    setMessages((m) => [...m, userMsg]);
    const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: combined };
    setMessages((m) => [...m, assistantMsg]);
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => chunksRef.current.push(e.data);
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const fd = new FormData();
      fd.append("audio", blob, "audio.webm");
      const { data } = await api.post("/api/ai/transcribe", fd);
      await sendMessage(data.text);
      setRecording(false);
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function ttsLast() {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return;
    const { data } = await api.post("/api/ai/tts", { text: last.content }, { responseType: "arraybuffer" });
    const blob = new Blob([data], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  }

  async function generateDoc(kind: "pdf" | "docx" | "md" | "txt") {
    const text = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
    const { data } = await api.post(`/api/documents/${kind}`, { filename: "chat", content: text }, { responseType: "blob" });
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">Imagem</button>
        <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={(e) => e.target.files && onPickImage(e.target.files[0])} />
        {!recording ? (
          <button onClick={startRecording} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">Gravar</button>
        ) : (
          <button onClick={stopRecording} className="px-3 py-1 rounded bg-red-600 hover:bg-red-500">Parar</button>
        )}
        <button onClick={() => generateDoc("pdf")} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">PDF</button>
        <button onClick={() => generateDoc("docx")} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">DOCX</button>
        <button onClick={() => generateDoc("md")} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">MD</button>
        <button onClick={() => generateDoc("txt")} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">TXT</button>
        <button onClick={ttsLast} className="ml-auto px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">Ouvir</button>
      </div>

      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="rounded border border-zinc-800 p-3 bg-zinc-900">
            <div className="text-xs uppercase text-zinc-400 mb-2">{m.role}</div>
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{m.content}</ReactMarkdown>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-700"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
        />
        <button className="rounded bg-blue-600 hover:bg-blue-500 px-4">Enviar</button>
      </form>
    </div>
  );
}
