const axios = require("axios");

const memory = new Map();

function detectLang(text) {
  const hasBn = /[\u0980-\u09FF]/.test(text);
  const hasEn = /[a-zA-Z]/.test(text);

  if (hasBn && hasEn) return "mix";
  if (hasBn) return "bn";
  return "en";
}

function buildPrompt(history, lang) {
  let system;

  if (lang === "bn") {
    system = "You are a helpful AI. Always reply in Bangla.";
  } else if (lang === "mix") {
    system = "You are a helpful AI. Reply in Banglish (mix of Bangla and English).";
  } else {
    system = "You are a helpful AI. Always reply in English.";
  }

  return (
    system +
    "\n\n" +
    history
      .map(x => `${x.role === "user" ? "User" : "Assistant"}: ${x.content}`)
      .join("\n") +
    "\nAssistant:"
  );
}

function cleanReply(text) {
  if (!text) return "⚠️ AI busy";

  return text
    .replace(/^"+|"+$/g, "")
    .replace(/\\n/g, " ")
    .replace(/\\/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = {
  config: {
    name: "ai",
    aliases: [],
    version: "8.0",
    author: "SAGOR",
    role: 0,
    category: "ai"
  },

  onStart: async function ({ api, event, args }) {
    try {
      const user = event.senderID;
      const text = args.join(" ");
      if (!text)
        return api.sendMessage("❌ | Enter text", event.threadID, event.messageID);

      const lang = detectLang(text);

      let history = memory.get(user) || [];

      history.push({ role: "user", content: text });
      if (history.length > 6) history.shift();

      const prompt = buildPrompt(history, lang);

      const res = await axios.get(
        `https://ai-api-sagor.vercel.app/sagor?key=sagor&prompt=${encodeURIComponent(prompt)}`
      );

      let reply =
        res?.data?.reply ||
        res?.data?.data?.response ||
        res?.data?.message ||
        "⚠️ AI busy";

      reply = cleanReply(reply);

      if (!reply || reply.length < 2) {
        if (lang === "bn") reply = "🤖 আবার চেষ্টা করুন";
        else if (lang === "mix") reply = "🤖 abar try koro";
        else reply = "🤖 Try again";
      }

      history.push({ role: "ai", content: reply });
      memory.set(user, history);

      return api.sendMessage(
        `${reply}`,
        event.threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "ai",
            author: user
          });
        },
        event.messageID
      );

    } catch {
      api.sendMessage("❌ | API Error", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    try {
      if (event.senderID !== Reply.author) return;

      const user = event.senderID;
      const text = event.body;
      if (!text) return;

      const lang = detectLang(text);

      let history = memory.get(user) || [];

      if (text.length < 2) history = [];

      history.push({ role: "user", content: text });
      if (history.length > 6) history.shift();

      const prompt = buildPrompt(history, lang);

      const res = await axios.get(
        `https://ai-api-sagor.vercel.app/sagor?key=sagor&prompt=${encodeURIComponent(prompt)}`
      );

      let reply =
        res?.data?.reply ||
        res?.data?.data?.response ||
        res?.data?.message ||
        "⚠️ AI busy";

      reply = cleanReply(reply);

      if (!reply || reply.length < 2) {
        if (lang === "bn") reply = "🤖 আবার চেষ্টা করুন";
        else if (lang === "mix") reply = "🤖 abar try koro";
        else reply = "🤖 Try again";
      }

      history.push({ role: "ai", content: reply });
      memory.set(user, history);

      return api.sendMessage(
        `${reply}`,
        event.threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "ai",
            author: user
          });
        },
        event.messageID
      );

    } catch {
      api.sendMessage("❌ | Chat error", event.threadID, event.messageID);
    }
  }
};
