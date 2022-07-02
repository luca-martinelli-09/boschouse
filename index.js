const config = require('./config')
const axios = require('axios');
const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("http");

const { createDBConnection, addLog } = require('./src/database')
const { bot, setMessage } = require('./src/tgbot');
const { groupJSON } = require('./src/utils');

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.set('view engine', 'pug');

const httpServer = createServer(app);
const io = new Server(httpServer);

function ringDoor(familyID) {
  dbConnection = createDBConnection();
  dbConnection.query(`select distinct Houses.RingDoorEndpoint from Houses
                        join InternalAccesses on InternalAccesses.House = Houses.ID
                        join Families on Families.InternalAccess = Houses.ID
                        where Families.ID = ?`, [familyID], (error, results, _) => {
    if (error) {
      return;
    }

    if (results.length > 0 && results[0].RingDoorEndpoint) {
      axios
        .post(results[0].RingDoorEndpoint, { family: familyID })
        .catch(error => {
          console.error(error);
        });
    }
  });

  dbConnection.end();
}

function sendMessageRequest(telegramUserID, message, hasEndpoint = false) {
  message = message && message.length > 0 ? "\n\n*MESSAGGIO*\n" + message : "";

  bot.sendMessage(telegramUserID, `🔔 C'è qualcuno alla porta! 🔔${message}\n\n💡 *Consiglio*\nPuoi inviare un messaggio al campanello rispondendo a questo avviso!`, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        hasEndpoint ?
          [{
            text: "Apri",
            callback_data: "open",
          }] : null,
        [{
          text: "Rifiuta",
          callback_data: "notopen",
        }]].filter((el) => el)
    }
  });
}

app.post("/api/ring/family/:familyID", (req, res) => {
  ringDoor(req.params.familyID);

  dbConnection = createDBConnection();
  dbConnection.query(`select FamilyComponents.TelegramUser, Houses.OpenDoorEndpoint from Families
                        join FamilyComponents on Families.ID = FamilyComponents.Family
                        join InternalAccesses on InternalAccesses.ID = Families.InternalAccess
                        join Houses on Houses.ID = InternalAccesses.House
                        where Families.ID = ? and not TelegramUser is null and Families.SilenceMode = 0`, [req.params.familyID], (error, results, _) => {

    addLog(`Qualcuno ha suonato alla famiglia ${req.params.familyID}: ${req.body.message}`);

    if (error) {
      res.status(404).json({
        ok: false,
        error: error.message
      });
    }

    if (results.length > 0) {
      for (i in results) {
        telegramUserID = results[i].TelegramUser;
        hasEndpoint = results[i].OpenDoorEndpoint != null;

        sendMessageRequest(telegramUserID, req.body.message, hasEndpoint);
      }

      res.status(200).json({
        ok: true
      });
    } else {
      res.status(404).json({
        ok: false,
        error: "Impossibile inviare la richiesta, nessun numero associato"
      })
    }
  });

  dbConnection.end();
});

app.post("/api/ring/user/:userID", (req, res) => {
  dbConnection = createDBConnection();
  dbConnection.query(`select FamilyComponents.Name, FamilyComponents.TelegramUser, FamilyComponents.Family, Houses.OpenDoorEndpoint
                        from FamilyComponents join Families on Families.ID = FamilyComponents.Family
                        join InternalAccesses on InternalAccesses.ID = Families.InternalAccess
                        join Houses on Houses.ID = InternalAccesses.House
                        where FamilyComponents.ID = ? and not FamilyComponents.TelegramUser is null and Families.SilenceMode = 0`, [req.params.userID], (error, results, _) => {

    addLog(`Qualcuno ha suonato all'utente ${req.params.userID}: ${req.body.message}`);

    if (error) {
      res.status(404).json({
        ok: false,
        error: error.message
      });
    }

    if (results.length > 0) {
      telegramUserID = results[0].TelegramUser;
      familyID = results[0].Family;
      hasEndpoint = results[0].OpenDoorEndpoint != null;

      ringDoor(familyID);

      sendMessageRequest(telegramUserID, req.body.message, hasEndpoint);

      res.status(200).json({
        ok: true
      });
    } else {
      res.status(404).json({
        ok: false,
        error: "Impossibile inviare la richiesta, nessun numero associato"
      })
    }
  });

  dbConnection.end();
});

app.get("/api/house/:houseID", (req, res) => {
  dbConnection = createDBConnection();
  dbConnection.query(`select Houses.ID as IDHouse, Houses.Name as HouseName, concat(Houses.Street, ", ", Houses.Number, " - ", Houses.CAP, ", ", Houses.City, " (", Houses.Province, ")") as Address,
                          InternalAccesses.ID as IDInternal, InternalAccesses.Floor as Floor,
                          Families.ID as IDFamily, MD5(Families.ID) as FamilyHash, Families.Name as FamilyName, Families.Message as FamilyMessage, Families.SilenceMode,
                          FamilyComponents.ID as IDComponent, FamilyComponents.Name as ComponentName, FamilyComponents.Surname as ComponentSurname
                        from Houses join InternalAccesses on InternalAccesses.House = Houses.ID
                          join Families on Families.InternalAccess = InternalAccesses.ID
                          join FamilyComponents on FamilyComponents.Family = Families.ID
                      where Houses.ID = ?
                      order by InternalAccesses.Floor asc, FamilyComponents.Surname asc, FamilyComponents.Name asc`,
    [req.params.houseID], (error, results, _) => {

      if (error) {
        res.status(500).json({
          ok: false,
          error: error.message
        })
      }

      groupByFamily = groupJSON(results, {
        IDHouse: "IDHouse",
        HouseName: "HouseName",
        Address: "Address",
        IDInternal: "IDInternal",
        Floor: "Floor",
        IDFamily: "IDFamily",
        FamilyHash: "FamilyHash",
        FamilyName: "FamilyName",
        FamilyMessage: "FamilyMessage",
        SilenceMode: "SilenceMode"
      }, "IDFamily", {
        ID: "IDComponent",
        Name: "ComponentName",
        Surname: "ComponentSurname",
      }, "Components");

      groupByInternal = groupJSON(groupByFamily, {
        IDHouse: "IDHouse",
        HouseName: "HouseName",
        Address: "Address",
        IDInternal: "IDInternal",
        Floor: "Floor",
      }, "IDInternal", {
        ID: "IDFamily",
        Hash: "FamilyHash",
        Name: "FamilyName",
        Message: "FamilyMessage",
        SilenceMode: "SilenceMode",
        Components: "Components",
      }, "Families");

      groupByHouse = groupJSON(groupByInternal, {
        ID: "IDHouse",
        Name: "HouseName",
        Address: "Address"
      }, "IDHouse", {
        ID: "IDInternal",
        Floor: "Floor",
        Families: "Families"
      }, "Internals");

      res.status(200).json({
        ok: true,
        data: groupByHouse[0]
      });
    });

  dbConnection.end();
});

bot.on("message", (msg) => {
  const userID = msg.from.id;
  const message = msg.text;

  if (msg.reply_to_message && msg.reply_to_message.text == "Rispondimi col messaggio che vuoi impostare") {
    setMessage(message, userID, msg.chat.id);
  } else if (msg.reply_to_message && msg.reply_to_message.reply_markup && msg.reply_to_message.reply_markup.inline_keyboard) {
    dbConnection = createDBConnection();
    dbConnection.query(`select Name, MD5(Family) as FamilyID
                        from FamilyComponents where TelegramUser = ?`, [userID], (error, results, _) => {

      if (error) {
        bot.sendMessage(msg.chat.id, "🛑 ERRORE: " + error);
        return;
      }

      addLog(`[${userID}] ha risposto: ${message}`);

      if (results.length > 0) {
        const familyID = results[0].FamilyID;
        const name = results[0].Name;

        io.to(familyID).emit("newMessage", message, name);
      }
    });

    dbConnection.end();
  }
});

app.use("/house/:houseID", (req, res) => {
  res.render("house", { houseID: req.params.houseID });
});

app.post(`/bot${config.telegram.api}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.use("/", (_, res) => {
  res.render("index");
});

// Socket server
io.on("connection", (socket) => {
  socket.on("joinFamilyDoorbell", (familyID) => {
    socket.join(familyID);
  });
});

httpServer.listen(config.server.port);