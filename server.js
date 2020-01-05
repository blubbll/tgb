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

  const wapContext = await Store.get(`wac/${message.chat.id}`);

  console.log(wapContext);

  //console.log(await telegram.getMe());

  //console.log(message);

  switch (message.type) {
    case "image":
      {
        await telegram.sendMessage(
          process.env.OWNER,
          `📷 Neues Bild von\n${message.chat.contact.pushname}<${message.chat.contact.id}>:`,
          {
            disable_notification: 1
          }
        );
        base64Img.img(
          `data:${message.mimetype};base64,${message.body}`,
          `${__dirname}/tmp`,
          message.filehash,
          async (err, filepath) => {
            console.log(filepath);
            const t = filepath;
            await telegram.sendPhoto(process.env.OWNER, {
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
          process.env.OWNER,
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
            await telegram.sendPhoto(process.env.OWNER, {
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
          process.env.OWNER,
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
          process.env.OWNER,
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
          process.env.OWNER,
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
          process.env.OWNER,
          `📍 Neuer Ort von\n${message.chat.contact.pushname}<${message.chat.contact.id}>:`
        );
        telegram.sendLocation(process.env.OWNER, message.lat, message.lng);
      }
      break;
    case "chat":
      {
        if (!message.chat.isGroup) {
          const waAccount = {
            chatId: message.chat.id,
            accName: message.sender.pushname,
            number: message.sender.formattedName
          };

          // console.log(waAccount);

          telegram.sendMessage(
            process.env.OWNER,
            `💬 Neue Nachricht von\n${message.sender.pushname}<${
              message.sender.id
            }>\n\t${"_".repeat(28)}\n\n${message.body}`,
            {
              disable_notification: 1
            }
          );
        } else {
          //Gruppe
          const waGroup = {
            chatId: message.chat.id,
            name: message.chat.contact.formattedName,
            desc: message.chat.groupMetadata.desc
          };

          telegram.sendMessage(
            process.env.OWNER,
            `📚 Neue Nachricht in Gruppe ${waGroup.name}<${
              waGroup.chatId
            }> von ${message.sender.pushname}<${message.sender.formattedName}>
              ${"_".repeat(30)}\n\n${message.body}`,
            {
              disable_notification: 1
            }
          );

          //console.log(waGroup);
        }
      }
      break;
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

var browserChannel = require("browserchannel").server;
//browserchannel
app.use(
  browserChannel(
    {
      base: `/channel`
    },
    session => {
      console.log(
        "New session: " +
          session.id +
          " from " +
          session.address +
          " with cookies " +
          session.headers.cookie
      );
      session.on("message", data => {
        console.log(data);
        session.send();
      });
      session.on("close", reason => {
        console.log(session.id + " disconnected (" + reason + ")");
      });
    }
  )
);

const numsDir = `${__dirname}/conf/nums`;
!fs.existsSync(numsDir) && fs.mkdirSync(numsDir);

bot.on("message", async ctx => {
  const msg = ctx.update.message;
  const txt = msg.text;

  if (txt && txt.startsWith("/")) {
    const args = txt.split(" ")[1];
    switch (txt.split(" ")[0]) {
      case "/num": {
        const num = args;
        fs.writeFileSync(`${numsDir}/${num}`, 1, {
          num: num,
          group: msg.chat
        });

        try {
          await telegram.setChatDescription(
            msg.chat.id,
            `WhatsApp-Gateway für Nummer +${num}.`
          );
          ctx.reply("Gateway-Konfiguration erfolgreich aktualisiert!\n✅");
        } catch (e) {
          ctx.reply(`${e.description}\n⚠️`);
        }
      }
    }
  } else console.log(ctx.update.message);
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
