// server.js
// where your node app starts

// init project
const express = require("express"),
  app = express(),
  fs = require("fs"),
  bodyParser = require("body-parser"),
  base64Img = require("base64-img"),
  jsonstore = require("./!.jsonstore"),
  cors = require("cors");

app.use([bodyParser.text(), express.json(), express.static("public")]);
app.use("*", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

const prefix = "/api";

app.post(`${prefix}/error`, async (req, res) => {
  const error = req.body;
  console.log(error);
  await telegram.sendMessage(process.env.OWNER, `❌ Error:`, {
    disable_notification: 1
  });
});

const Store = jsonstore(process.env.STORE_TOKEN);

app.post(`${prefix}/msg`, async (req, res) => {
  const message = JSON.parse(req.body);

  // console.log(message);

  let waChats = await Store.get(`waChats`);
  if (waChats === null) {
    waChats = {};
    await Store.post(`waChats`, waChats);
    console.log("WaChats initiated.");
  } else waChats = JSON.parse(waChats);

  const key = `${message.chat.id}`;
  const reqChat = waChats[key];

  //chat destination
  let dest = "";
  if (reqChat === void 0) {
    const newChat = {
      waId: message.sender.id,
      group: message.isGroupMsg,
      nick: message.isGroupMsg
        ? message.chat.contact.formattedName
        : message.chat.contact.pushname,
      no: message.isGroupMsg
        ? message._groupOwner.formattedName
        : message.chat.contact.formattedName
    };

    waChats[key] = newChat;

    await Store.post(`waChats`, JSON.stringify(waChats));
    console.log("waChats updated.");
    dest = process.env.OWNER;
  } else {
    dest = reqChat.tId === null ? process.env.OWNER : reqChat.tId;
  }

  //Store.post("waChats", {})
  //console.log(waChats);

  //console.log(await telegram.getMe());

  //console.log(message);

  switch (message.type) {
    case "chat":
      {
        //pm
        if (!message.chat.isGroup) {
          const waAccount = {
            chatId: message.chat.id,
            accName: message.sender.pushname,
            number: message.sender.formattedName
          };

          // console.log(waAccount);

          telegram.sendMessage(
            dest,
            reqChat.tId === null
              ? `💬 Neue Nachricht von\n${message.sender.pushname}<${
                  message.sender.id
                }>\n\t${"_".repeat(28)}\n\n${message.body}`
              : message.body,
            {
              disable_notification: 1
            }
          );
        } else {
          //Gruppe
          const waGroup = {
            chatId: message.chat.id,
            name: message.chat.contact.formattedName,
            desc: message.chat.groupMetadata.desc,
            tId: null
          };

          telegram.sendMessage(
            dest,
            reqChat.tId === null
              ? `📚 Neue Nachricht in Gruppe ${waGroup.name}<${
                  waGroup.chatId
                }> von ${message.sender.pushname}<${
                  message.sender.formattedName
                }>
              ${"_".repeat(30)}\n\n${message.body}`
              : `📚 ${message.sender.pushname}<${message.sender.formattedName}>:\n\n${message.body}`,
            {
              disable_notification: 1
            }
          );

          //console.log(waGroup);
        }
      }
      break;
    case "image":
      {
        if (message.chat.isGroup) {
          await telegram.sendMessage(
            dest,
            `📷 Neues Bild von\n${message.chat.contact.pushname}:`,
            {
              disable_notification: 1
            }
          );
        } else {
          await telegram.sendMessage(
            dest,
            reqChat.tId === null
              ? `📷 Neues Bild von\n${message.chat.contact.pushname}<${message.chat.contact.id}>:`
              : `📷 Neues Bild:`,
            {
              disable_notification: 1
            }
          );
        }
        base64Img.img(
          `data:${message.mimetype};base64,${message.body}`,
          `${__dirname}/tmp`,
          message.filehash,
          async (err, filepath) => {
            console.log(filepath);
            const t = filepath;
            await telegram.sendPhoto(dest, {
              source: fs.readFileSync(t)
            });
            fs.unlinkSync(filepath);
          }
        );
      }
      break;
    case "video":
      {
        await telegram.sendMessage(
          dest,
          `🎬 Neues Video von\n${message.chat.contact.pushname}<${message.chat.contact.id}> (nur Thumbnail):`,
          {
            disable_notification: 1
          }
        );
        base64Img.img(
          `data:image/png;base64,${message.body}`,
          `${__dirname}/tmp`,
          message.filehash,
          async (err, filepath) => {
            console.log(filepath);
            const t = filepath;
            await telegram.sendPhoto(dest, {
              source: fs.readFileSync(t)
            });
            fs.unlinkSync(filepath);
          }
        );
      }
      break;
    case "sticker":
      {
        await telegram.sendMessage(
          dest,
          `📎 Neuer Sticker von\n${message.chat.contact.pushname}<${message.chat.contact.id}>(protected...)`,
          {
            disable_notification: 1
          }
        );
      }
      break;
    case "audio":
      {
        await telegram.sendMessage(
          dest,
          `🎵 Neues Audio von\n${message.chat.contact.pushname}<${message.chat.contact.id}>(protected...)`,
          {
            disable_notification: 1
          }
        );
      }
      break;
    case "ptt":
      {
        await telegram.sendMessage(
          dest,
          `🔈 Neues voice memo von\n${message.chat.contact.pushname}<${message.chat.contact.id}>(protected...)`,
          {
            disable_notification: 1
          }
        );
      }
      break;
    case "location":
      {
        /*await telegram.sendMessage(
          process.env.OWNER,
          `📍 Neuer Ort von\n${message.chat.contact.pushname}<${
            message.chat.contact.id
          }>
          \t${"_".repeat(28)}\n\n

          Location: ${message.loc.replace(/\n/gi, "")}
          Latitude: ${message.lat}
          Longitude: ${message.lng}
          gMaps: https://www.google.com/maps/search/?api=1&query=${
            message.lat
          },${message.lng}
`,
          {
            disable_notification: 1
          }
        );*/
        await telegram.sendMessage(
          dest,
          `📍 Neuer Ort von\n${message.chat.contact.pushname}<${message.chat.contact.id}>:`
        );
        telegram.sendLocation(dest, message.lat, message.lng);
      }
      break;
  }

  //only reply to pms
  if (!message.isGroupMsg) {
    const m = "✓ Nachricht wurde weitergeleitet";
    emitter.emit("event", {
      type: "msg",
      data: {
        to: key,
        text: `✓ 𝘕𝘢𝘤𝘩𝘳𝘪𝘤𝘩𝘵 𝘸𝘶𝘳𝘥𝘦 𝘸𝘦𝘪𝘵𝘦𝘳𝘨𝘦𝘭𝘦𝘪𝘵𝘦𝘵. \n${transform(
          "Melde mich später…"
        )}\n~ℝ𝕦𝕓𝕖𝕟`
      }
    });
  }

  res.end();
});

const Telegraf = require("telegraf");
const Telegram = require("telegraf/telegram");

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const telegram = new Telegram(process.env.TELEGRAM_TOKEN);

app.post("/:token/:type/:number", (req, res) => {});

(async () => {
  //console.log(await telegram.getMe());
})();

const EventEmitter = require("eventemitter3");
const emitter = new EventEmitter();

app.get(`/events/${process.env.WAE_TOKEN}`, cors(), (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  // Heartbeat
  const nln = () => {
    res.write("\n");
  };
  const hbt = setInterval(nln, 15000);

  const onEvent = data => {
    res.write("retry: 500\n");
    res.write(`event: event\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  emitter.on("event", onEvent);

  // Clear heartbeat and listener
  req.on("close", () => {
    clearInterval(hbt);
    emitter.removeListener("event", onEvent);
  });
});

setInterval(() => {
  //emitter.emit('event', {ping: "test"});
}, 4999);

bot.on("message", async ctx => {
  const msg = ctx.update.message;
  const txt = msg.text;

  // emitter.emit('event', {ping: "test"});

  if (txt && txt.startsWith("/")) {
    const args = txt.split(" ")[1];
    switch (txt.split(" ")[0]) {
      case "/set": {
        const key = args;

        let waChats = await Store.get(`waChats`);
        if (waChats === null) {
          waChats = {};
          await Store.post(`waChats`, waChats);
          console.log("WaChats initiated.");
        } else waChats = JSON.parse(waChats);

        const reqChat = waChats[key];
        //update telegram id

        const _tId = reqChat.tId;
        reqChat.tId = msg.chat.id;

        await Store.post(`waChats`, JSON.stringify(waChats));
        console.log("waChats updated.");

        //only notify if not in db already with diff number
        _tId === undefined &&
          emitter.emit("event", {
            type: "msg",
            data: {
              to: key,
              text: `🤖 𝘕𝘢𝘤𝘩𝘳𝘪𝘤𝘩𝘵𝘦𝘯 𝘸𝘦𝘳𝘥𝘦𝘯 𝘢𝘣 𝘫𝘦𝘵𝘻𝘵 𝘸𝘦𝘪𝘵𝘦𝘳𝘨𝘦𝘭𝘦𝘪𝘵𝘦𝘵.`
            }
          });

        try {
          //console.log(reqChat);
          await telegram.setChatTitle(msg.chat.id, `📞~${reqChat.nick}`); //telefon icon
          await telegram.setChatDescription(
            msg.chat.id,
            `WhatsApp-Gateway für Nummer ${reqChat.no}\nWa-Account[${
              reqChat.waId
            }].\nLetztes Update:\n${new Date()}`
          );
          ctx.reply("Gateway-Konfiguration erfolgreich aktualisiert!\n✅");
        } catch (e) {
          ctx.reply(`${e.description}\n⚠️`);
        }
      }
    }
  } else {
    let waChats = await Store.get(`waChats`);
    if (waChats === null) {
      waChats = {};
      await Store.post(`waChats`, waChats);
      console.log("WaChats initiated.");
    } else waChats = JSON.parse(waChats);

    console.log();
    let reqChat;
    for (const [key, value] of Object.entries(waChats)) {
      if (waChats[key].tId === msg.chat.id) {
        reqChat = waChats[key];
        break;
      }
    }

    if (reqChat) {
      emitter.emit("event", {
        type: "msg",
        data: {
          to: reqChat.waId,
          text: transform(txt)
        }
      });
    }
  }
  //console.log(ctx.update.message.text)

  //console.log(ctx.update.message.from);
  //console.log(ctx.update.message.chat);
  //console.log(ctx.update.message.date);

  //ctx.reply("Hey there");
});
bot.launch();

telegram.sendMessage(process.env.OWNER, "✅ Bot aktiv.", {
  disable_notification: 1
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

const map = new Map([
  ["A", "𝖠"],
  ["B", "𝖡"],
  ["C", "𝖢"],
  ["D", "𝖣"],
  ["E", "𝖤"],
  ["F", "𝖥"],
  ["G", "𝖦"],
  ["H", "𝖧"],
  ["I", "𝖨"],
  ["J", "𝖩"],
  ["K", "𝖪"],
  ["L", "𝖫"],
  ["M", "𝖬"],
  ["N", "𝖭"],
  ["O", "𝖮"],
  ["P", "𝖯"],
  ["Q", "𝖰"],
  ["R", "𝖱"],
  ["S", "𝖲"],
  ["T", "𝖳"],
  ["U", "𝖴"],
  ["V", "𝖵"],
  ["W", "𝖶"],
  ["X", "𝖷"],
  ["Y", "𝖸"],
  ["Z", "𝖹"],
  ["a", "𝖺"],
  ["b", "𝖻"],
  ["c", "𝖼"],
  ["d", "𝖽"],
  ["e", "𝖾"],
  ["f", "𝖿"],
  ["g", "𝗀"],
  ["h", "𝗁"],
  ["i", "𝗂"],
  ["j", "𝗃"],
  ["k", "𝗄"],
  ["l", "𝗅"],
  ["m", "𝗆"],
  ["n", "𝗇"],
  ["o", "𝗈"],
  ["p", "𝗉"],
  ["q", "𝗊"],
  ["r", "𝗋"],
  ["s", "𝗌"],
  ["t", "𝗍"],
  ["u", "𝗎"],
  ["v", "𝗏"],
  ["w", "𝗐"],
  ["x", "𝗑"],
  ["y", "𝗒"],
  ["z", "𝗓"],
  ["0", "𝟢"],
  ["1", "𝟣"],
  ["2", "𝟤"],
  ["3", "𝟥"],
  ["4", "𝟦"],
  ["5", "𝟧"],
  ["6", "𝟨"],
  ["7", "𝟩"],
  ["8", "𝟪"],
  ["9", "𝟫"]
]);

const transform = input => {
  let output = "";
  var regex = new RegExp("^[a-zA-Z0-9]+$");

  input &&
    input.split("").forEach(char => {
      regex.test(char) ? [(output += map.get(char))] : (output += char);
    });
  return output;
};
