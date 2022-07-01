const config = require('./config')
const express = require("express");
const { createServer } = require("http");

const { createDBConnection, addLog } = require('./src/database')
const { bot } = require('./src/tgbot');
const { groupJSON } = require('./src/utils');

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.set('view engine', 'pug');

const httpServer = createServer(app);

app.post(`/bot${config.telegram.api}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

function ringDoor(familyID) {
  axios
    .post(config.server.nodeRingDoor, { family: familyID })
    .catch(error => {
      console.error(error);
    });
}

function sendMessageRequest(telegramUserID, message) {
  message = req.body.message && req.body.message.length > 0 ? "\n\n*MESSAGGIO*\n" + req.body.message : "";

  bot.sendMessage(telegramUserID, `🔔 C'è qualcuno alla porta! 🔔${message}`, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[
        {
          text: "Apri",
          callback_data: "open",
        }
      ]]
    }
  });
}

app.post("/api/ring/family/:familyID", (req, res) => {
  ringDoor(familyID);

  dbConnection = createDBConnection();
  dbConnection.query(`select TelegramUser
                        from Families join FamilyComponents on Families.ID = FamilyComponents.Family
                        where Families.ID = ? and not TelegramUser is null`, [req.params.familyID], (error, results, _) => {
    dbConnection.end();

    addLog(`Qualcuno ha suonato alla famiglia ${req.params.familyID}: ${req.body.message}`);

    if (error) {
      res.status(404).json({
        ok: false,
        error: error.message
      });
    }

    message = req.body.message && req.body.message.length > 0 ? "\n\n*MESSAGGIO*\n" + req.body.message : "";

    if (results.length > 0) {
      for (i in results) {
        telegramUserID = results[i].TelegramUser;
        sendMessageRequest(telegramUserID, req.body.message);
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
});

app.post("/api/ring/user/:userID", (req, res) => {
  dbConnection = createDBConnection();
  dbConnection.query("select Name, TelegramUser, Family from FamilyComponents where ID = ? and not TelegramUser is null", [req.params.userID], (error, results, _) => {
    dbConnection.end();

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

      ringDoor(familyID)

      sendMessageRequest(telegramUserID, req.body.message);

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
});

app.get("/api/house/:houseID", (req, res) => {
  dbConnection = createDBConnection();
  dbConnection.query(`select Houses.ID as IDHouse, Houses.Name as HouseName, concat(Houses.Street, ", ", Houses.Number, " - ", Houses.CAP, ", ", Houses.City, " (", Houses.Province, ")") as Address,
                          InternalAccesses.ID as IDInternal, InternalAccesses.Floor as Floor,
                          Families.ID as IDFamily, Families.Name as FamilyName, Families.Message as FamilyMessage,
                          FamilyComponents.ID as IDComponent, FamilyComponents.Name as ComponentName, FamilyComponents.Surname as ComponentSurname
                        from Houses join InternalAccesses on InternalAccesses.House = Houses.ID
                          join Families on Families.InternalAccess = InternalAccesses.ID
                          join FamilyComponents on FamilyComponents.Family = Families.ID
                      where Houses.ID = ?
                      order by InternalAccesses.Floor asc, FamilyComponents.Surname asc, FamilyComponents.Name asc`,
    [req.params.houseID], (error, results, _) => {
      dbConnection.end();

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
        FamilyName: "FamilyName",
        FamilyMessage: "FamilyMessage"
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
        Name: "FamilyName",
        Message: "FamilyMessage",
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
    })
});

app.use("/house/:houseID", (req, res) => {
  res.render("house", { houseID: req.params.houseID });
});

app.use("/", (_, res) => {
  res.render("index");
});

httpServer.listen(config.server.port);