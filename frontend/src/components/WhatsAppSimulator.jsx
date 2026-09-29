import React, { useState } from 'react';
import { Send, Image, CheckCheck, Bot, Sparkles, RefreshCw } from 'lucide-react';
import { sendWhatsAppWebhook } from '../services/api';

const SAMPLES = [
  {
    name: 'Sample 1: Sinhala + English (Mixed)',
    filename: 'sample_ledger_sinhala.png',
    desc: 'Contains: විකුණුම්, විදුලි බිල, Supplier Payment, බස් ගාස්තු (Low Conf!)'
  },
  {
    name: 'Sample 2: English Printed Ledger',
    filename: 'sample_ledger_english.png',
    desc: 'Contains: Daily Sales, Rent Payment, Electricity Bill, Staff Salary'
  },
  {
    name: 'Sample 3: Mixed Handwriting Ledger',
    filename: 'sample_ledger_mixed.png',
    desc: 'Contains: විකුණුම් 28000, Electricity බිල 3500, සැපයුම්කරු 9500'
  }
];

export default function WhatsAppSimulator({ onDataUpdated }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'LedgerAI 🤖 Business Assistant Ready!\n\nSend a photograph of your daily paper ledger (Sinhala/English/Mixed) to digitize automatically.',
      time: '10:00 AM'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendSampleImage = async (sample) => {
    const userMsg = {
      sender: 'user',
      text: `[Photo Sent]: ${sample.name}`,
      imageUrl: `http://localhost:8000/uploads/${sample.filename}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendWhatsAppWebhook({
        from_number: '+94771234567',
        image_url: sample.filename
      });

      const botMsg = {
        sender: 'bot',
        text: res.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '⚠️ Connection error contacting backend.', time: 'Now' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTextCommand = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    setInputText('');

    const userMsg = {
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendWhatsAppWebhook({
        from_number: '+94771234567',
        message_text: userText
      });

      const botMsg = {
        sender: 'bot',
        text: res.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '⚠️ Connection error contacting backend.', time: 'Now' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sample Ledger Picker Sidebar */}
      <div className="lg:col-span-5 space-y-4">
        <div className="glass-card p-6">
          <h3 className="text-md font-bold text-slate-100 mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Physical Ledger Photo Test Gallery
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Click any physical ledger sample to simulate sending a photo over WhatsApp:
          </p>

          <div className="space-y-3">
            {SAMPLES.map((sample, idx) => (
              <div
                key={idx}
                onClick={() => handleSendSampleImage(sample)}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 cursor-pointer transition group flex items-center gap-3"
              >
                <div className="w-16 h-12 bg-slate-950 rounded-lg overflow-hidden flex-shrink-0 border border-slate-800">
                  <img
                    src={`http://localhost:8000/uploads/${sample.filename}`}
                    alt={sample.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-emerald-400 transition">
                    {sample.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">{sample.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 text-xs text-slate-400 space-y-2">
          <p className="font-bold text-slate-200">💡 Interactive Commands to Try:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Type <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono">CONFIRM</code> to verify low-confidence records.</li>
            <li>Type <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300 font-mono">Transport 500</code> or <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300 font-mono">Electricity 3500</code> to test WhatsApp text corrections!</li>
          </ul>
        </div>
      </div>

      {/* WhatsApp Chat View Window */}
      <div className="lg:col-span-7">
        <div className="glass-card overflow-hidden border border-slate-700 flex flex-col h-[560px]">
          {/* WhatsApp Header */}
          <div className="bg-emerald-700 px-4 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-900 flex items-center justify-center border border-emerald-400/40">
                <Bot className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h4 className="text-sm font-bold leading-tight">LedgerAI Business Bot</h4>
                <p className="text-[10px] text-emerald-200">Official WhatsApp Business Account • Online</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded-full border border-emerald-600 font-semibold">
              Sinhala & English AI
            </span>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0d141e] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-emerald-700 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
                  }`}
                >
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded Ledger"
                      className="w-full max-h-48 object-cover rounded-xl mb-2 border border-black/20"
                    />
                  )}
                  <p className="whitespace-pre-line font-medium leading-relaxed">{msg.text}</p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-70">
                    <span>{msg.time}</span>
                    {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 p-2 rounded-xl w-max border border-slate-700">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>AI processing Sinhala & English ledger OCR...</span>
              </div>
            )}
          </div>

          {/* WhatsApp Text Input Footer */}
          <form onSubmit={handleSendTextCommand} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Type 'CONFIRM' or send correction e.g. 'Transport 500'"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md shadow-emerald-600/30 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
