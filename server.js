// server.js
// where your node app starts

// init project
const express = require("express"),
  app = express(),
  fs = require("fs"),
  bodyParser = require("body-parser");
app.use(bodyParser.text());
var base64ToImage = require("base64-to-image");

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

const prefix = "/api";
app.post(`${prefix}/msg`, async (req, res) => {
  const message = JSON.parse(req.body);

  //console.log(message);
  console.log(message);
  switch (message.type) {
    case "image":
      {
        await telegram.sendMessage(
          process.env.OWNER,
          `Neues Bild von\n${message.chat.contact.pushname}\n(${
            message.chat.contact.formattedName
          })\n${"_".repeat(18)}:\n
    `,
          {
            disable_notification: 1
          }
        );
      
        const t = `${__dirname}/tmp/${message.filehash}`;
        base64ToImage(`data:${message.mimetype};base64,${message.body}`, t);
        console.log(t)
        await telegram.sendPhoto(process.env.OWNER, {
          source: fs.readFileSync(t)
        });
        fs.unlinkFileSync();
      }
      break;
    case "chat":
      {
        telegram.sendMessage(
          process.env.OWNER,
          `Neue Nachricht von\n${message.chat.contact.pushname}\n(${
            message.chat.contact.formattedName
          })\n${"_".repeat(18)}:\n
      ${message.body}
    `,
          {
            disable_notification: 1
          }
        );
      }
      break;
  }

  res.end();
});

app.use(express.json());

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

const Telegraf = require("telegraf");
const Telegram = require("telegraf/telegram");

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const telegram = new Telegram(process.env.TELEGRAM_TOKEN);

app.post("/:token/:type/:number", (req, res) => {});

//telegram.sendMessage(-1001452748835, "test");

(async () => {
  //console.log(await telegram.getMe());
})();

{
  //confdir
  const confDir = `${__dirname}/conf`;
  !fs.existsSync(confDir) && fs.mkdirSync(confDir);
  //numsdir
  const numsDir = `${confDir}/nums`;
  !fs.existsSync(numsDir) && fs.mkdirSync(numsDir);
}

const numsDir = `${__dirname}/conf/nums`;
!fs.existsSync(numsDir) && fs.mkdirSync(numsDir);

bot.on("message", async ctx => {
  const msg = ctx.update.message;
  const txt = msg.text;

  if (txt.startsWith("/")) {
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
  }
  //console.log(ctx.update.message.text)

  //console.log(ctx.update.message.from);
  //console.log(ctx.update.message.chat);
  //console.log(ctx.update.message.date);

  //ctx.reply("Hey there");
});
bot.launch();

telegram.sendMessage(process.env.OWNER, "Bot aktiv.", {
  disable_notification: 1
});
