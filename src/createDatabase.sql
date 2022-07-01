CREATE TABLE IF NOT EXISTS Houses (
  ID INT NOT NULL AUTO_INCREMENT,
  Name VARCHAR(200) NOT NULL,
  Street VARCHAR(300) NOT NULL,
  Number VARCHAR(100) NOT NULL,
  CAP VARCHAR(50) NOT NULL,
  City VARCHAR(100) NOT NULL,
  Province VARCHAR(100) NOT NULL,
  Country VARCHAR(100) NOT NULL,

  PRIMARY KEY (ID)
);

CREATE TABLE IF NOT EXISTS InternalAccesses (
  ID INT NOT NULL AUTO_INCREMENT,
  Floor INT NOT NULL,
  House INT NOT NULL,

  PRIMARY KEY (ID),
  FOREIGN KEY (House) REFERENCES Houses(ID)
);

CREATE TABLE IF NOT EXISTS Families (
  ID INT NOT NULL AUTO_INCREMENT,
  Name VARCHAR(300) NOT NULL,
  InternalAccess INT NOT NULL,
  Message VARCHAR(700) DEFAULT NULL,

  PRIMARY KEY (ID),
  FOREIGN KEY (InternalAccess) REFERENCES InternalAccesses(ID)
);

CREATE TABLE IF NOT EXISTS FamilyComponents (
  ID INT NOT NULL AUTO_INCREMENT,
  Name VARCHAR(300) NOT NULL,
  Surname VARCHAR(300) NOT NULL,
  Family INT NOT NULL,
  TelegramUser INT DEFAULT NULL,

  PRIMARY KEY (ID),
  FOREIGN KEY (Family) REFERENCES Families(ID)
);

CREATE TABLE IF NOT EXISTS Activities (
  ID INT NOT NULL AUTO_INCREMENT,
  Component INT DEFAULT NULL,
  Log VARCHAR(500) NOT NULL,
  DateTime DATETIME DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (ID),
  FOREIGN KEY (Component) REFERENCES FamilyComponents(ID)
);

INSERT INTO Houses VALUES (1, "Casa Boscaini", "Via Francesco Petrarca", "10", "37060", "Lugagnano", "Verona", "Italia");

INSERT INTO InternalAccesses VALUES (1, 0, 1);
INSERT INTO InternalAccesses VALUES (2, 1, 1);
INSERT INTO InternalAccesses VALUES (3, -1, 1);
INSERT INTO InternalAccesses VALUES (4, 2, 1);

INSERT INTO Families VALUES (1, "Boscaini-Martinelli", 1, NULL);
INSERT INTO Families VALUES (2, "Boscaini-Girelli", 2, NULL);

INSERT INTO FamilyComponents VALUES (1, "Luca", "Martinelli", 1, NULL);
INSERT INTO FamilyComponents VALUES (2, "Fabiana", "Boscaini", 1, NULL);
INSERT INTO FamilyComponents VALUES (3, "Renato", "Martinelli", 1, NULL);
INSERT INTO FamilyComponents VALUES (4, "Alberto", "Boscaini", 2, NULL);
INSERT INTO FamilyComponents VALUES (5, "Silvia", "Boscaini", 2, NULL);
INSERT INTO FamilyComponents VALUES (6, "Cristina", "Girelli", 2, NULL);