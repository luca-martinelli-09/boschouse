const config = require('../config');
const axios = require('axios');
const { createDBConnection } = require('./database')

const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(config.telegram.api);

bot.setWebHook(`${config.server.host}/bot${config.telegram.api}`);

function setMessage(message, userID, chatID) {
  dbConnection = createDBConnection();
  dbConnection.query(`update Families
                        join FamilyComponents on FamilyComponents.Family = Families.ID
                        set Families.Message = ?
                        where FamilyComponents.TelegramUser = ?`, [message, userID], (error, results, _) => {
    dbConnection.end();

    if (error) {
      bot.sendMessage(chatID, "🛑 ERRORE: " + error);
    }

    if (results.affectedRows > 0) {
      bot.sendMessage(chatID, "✅ Messaggio modificato");
    } else {
      bot.sendMessage(chatID, "🛑 Nessuna modifica fatta, forse non hai le autorizzazioni necessarie");
    }
  });
}

function clearMessage(userID, chatID) {
  dbConnection = createDBConnection();
  dbConnection.query(`update Families
                        join FamilyComponents on FamilyComponents.Family = Families.ID
                        set Families.Message = NULL
                        where FamilyComponents.TelegramUser = ?`, [userID], (error, results, _) => {
    dbConnection.end();

    if (error) {
      bot.sendMessage(chatID, "🛑 ERRORE: " + error);
    }

    if (results.affectedRows > 0) {
      bot.sendMessage(chatID, "✅ Messaggio cancellato");
    } else {
      bot.sendMessage(chatID, "🛑 Nessuna modifica fatta, forse non hai le autorizzazioni necessarie");
    }
  });
}

bot.onText(/\/avviso (.+)/, (msg, match) => {
  const userID = msg.from.id;
  const message = match[1];

  setMessage(message, userID, msg.chat.id);
});

bot.onText(/\/avviso/, (msg, _) => {
  bot.sendMessage(msg.chat.id, "Rispondimi col messaggio che vuoi impostare", {
    reply_to_message_id: msg.id,
    reply_markup: {
      force_reply: true
    }
  })
});

bot.onText(/\/cancellaavviso/, (msg, _) => {
  const userID = msg.from.id;

  clearMessage(userID, msg.chat.id);
});

bot.onText(/\/apri/, () => {
  axios
    .get(config.server.nodeOpenDoor)
    .then(function () {
      bot.sendMessage(userID, "✅ Porta aperta");
    })
    .catch(error => {
      console.error(error);
    });
});

bot.on('callback_query', function onCallbackQuery(q) {
  if (q.data == "open") {
    axios
      .get(config.server.nodeOpenDoor)
      .then(function () {
        bot.sendMessage(userID, "✅ Porta aperta");
      })
      .catch(error => {
        console.error(error);
      });
  }
});

bot.on("message", (msg) => {
  const userID = msg.from.id;
  const message = msg.text;

  if (msg.reply_to_message && msg.reply_to_message.text == "Rispondimi col messaggio che vuoi impostare") {
    setMessage(message, userID, msg.chat.id);
  }
});

module.exports = { bot };