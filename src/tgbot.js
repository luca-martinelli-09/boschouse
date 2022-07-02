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
      return;
    }

    if (results.affectedRows > 0) {
      bot.sendMessage(chatID, "✅ Messaggio cancellato");
    } else {
      bot.sendMessage(chatID, "🛑 Nessuna modifica fatta, forse non hai le autorizzazioni necessarie");
    }
  });
}

const setSilenceMode = (silence, userID, chatID) => {
  dbConnection = createDBConnection();
  dbConnection.query(`update Families
                        join FamilyComponents on FamilyComponents.Family = Families.ID
                        set Families.SilenceMode = ?
                        where FamilyComponents.TelegramUser = ?`, [silence ? 1 : 0, userID], (error, results, _) => {

    addLog(`[${userID}] Modalità silenziosa ${silence}`);

    if (error) {
      bot.sendMessage(chatID, "🛑 ERRORE: " + error);
      return;
    }

    if (results.affectedRows > 0) {
      bot.sendMessage(chatID, "✅ Modalità silenziosa " + (silence ? "attivata" : "disattivata"));
    } else {
      bot.sendMessage(chatID, "🛑 Nessuna modifica fatta, forse non hai le autorizzazioni necessarie");
    }
  });

  dbConnection.end();
}

const openDoor = (userID, onOpen, onError) => {
  dbConnection = createDBConnection();
  dbConnection.query(`select Houses.OpenDoorEndpoint
                        from FamilyComponents join Families on Families.ID = FamilyComponents.Family
                        join InternalAccesses on InternalAccesses.ID = Families.InternalAccess
                        join Houses on Houses.ID = InternalAccesses.House
                        where FamilyComponents.TelegramUser = ?`, [userID], (error, results, _) => {

    if (error) {
      onError();
      return;
    }

    if (results.length > 0 && results[0].OpenDoorEndpoint) {
      axios
        .get(results[0].OpenDoorEndpoint)
        .then(() => {
          onOpen();
        })
        .catch((error) => {
          onError();
          console.log(error);
        });
    } else {
      onError();
    }
  });

  dbConnection.end();
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

bot.onText(/\/apri/, (msg) => {
  openDoor(msg.from.id, () => {
    bot.sendMessage(msg.chat.id, "✅ Porta aperta");
    addLog(`[${msg.from.id}] Porta aperta`);
  }, () => {
    bot.sendMessage(msg.chat.id, "🛑 Impossibile aprire la porta");
  });
});

bot.onText(/\/attiva/, (msg, _) => {
  setSilenceMode(false, msg.from.id, msg.chat.id);
});

bot.onText(/\/disattiva/, (msg, _) => {
  setSilenceMode(true, msg.from.id, msg.chat.id);
});

bot.on('callback_query', function onCallbackQuery(q) {
  if (q.data == "open") {
    openDoor(q.from.id, () => {
      bot.editMessageReplyMarkup(null, {
        chat_id: q.message.chat.id,
        message_id: q.message.message_id,
      });

      bot.editMessageText(q.message.text + "\n\n✅ Porta aperta", {
        chat_id: q.message.chat.id,
        message_id: q.message.message_id,
      });

      addLog(`[${q.from.id}] Porta aperta`);
    }, () => {
      bot.editMessageReplyMarkup(null, {
        chat_id: q.message.chat.id,
        message_id: q.message.message_id,
      });

      bot.editMessageText(q.message.text + "\n\n🛑 Impossibile aprire la porta", {
        chat_id: q.message.chat.id,
        message_id: q.message.message_id,
      });
    });
  } else if (q.data == "notopen") {
    addLog(`[${q.from.id}] Porta non aperta`);

    bot.editMessageReplyMarkup(null, {
      chat_id: q.message.chat.id,
      message_id: q.message.message_id,
    });

    bot.editMessageText(q.message.text + "\n\n🛑 Porta NON aperta", {
      chat_id: q.message.chat.id,
      message_id: q.message.message_id,
    });
  }
});

module.exports = { bot, setMessage, clearMessage };