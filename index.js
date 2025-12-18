import { Client, GatewayIntentBits } from "discord.js";
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import {
  DISCORD_TOKEN,
  DISCORD_CHANNEL_ID,
  WHATSAPP_NUMBER
} from "./config.js";

const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

discord.login(DISCORD_TOKEN);

discord.once("ready", () => {
  console.log("Discord bot online");
});

async function startWA() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    if (!text) return;

    const channel = await discord.channels.fetch(DISCORD_CHANNEL_ID);
    channel.send(`📩 WhatsApp:\n${text}`);
  });

  discord.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (msg.channel.id !== DISCORD_CHANNEL_ID) return;

    await sock.sendMessage(WHATSAPP_NUMBER, { text: msg.content });
  });
}

startWA();
