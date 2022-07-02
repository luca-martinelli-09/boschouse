const config = require('../config');
const axios = require('axios');
const { createDBConnection, addLog } = require('./database')

const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(config.telegram.api);

bot.setWebHook(`${config.server.host}/bot${config.telegram.api}`);

const setMessage = (message, userID, chatID) => {
  dbConnection = createDBConnection();
  dbConnection.query(`update Families
                        join FamilyComponents on FamilyComponents.Family = Families.ID
                        set Families.Message = ?
                        where FamilyComponents.TelegramUser = ?`, [message, userID], (error, results, _) => {
    dbConnection.end();

    addLog(`[${userID}] Nuovo avviso: ${message}`);

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

const clearMessage = (userID, chatID) => {
  dbConnection = createDBConnection();
  dbConnection.query(`update Families
                        join FamilyComponents on FamilyComponents.Family = Families.ID
                        set Families.Message = NULL
                        where FamilyComponents.TelegramUser = ?`, [userID], (error, results, _) => {
    dbConnection.end();

    addLog(`[${userID}] Messaggio cancellato`);

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
  addLog(`[${userID}] Porta aperta`);

  axios
    .get(config.server.nodeOpenDoor)
    .then(function () {
      bot.sendMessage(userID, "✅ Porta aperta");
      addLog()
    })
    .catch(error => {
      console.error(error);
    });
});

bot.on('callback_query', function onCallbackQuery(q) {
  if (q.data == "open") {
    addLog(`[${q.from.id}] Porta aperta`);

    axios
      .get(config.server.nodeOpenDoor)
      .then(function () {
        bot.editMessageReplyMarkup({'inline_keyboard': [[]]});
        bot.sendMessage(q.message.chat.id, "✅ Porta aperta");
      })
      .catch(error => {
        console.error(error);
      });
  }
});

module.exports = { bot, setMessage, clearMessage };