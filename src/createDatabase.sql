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
  SilenceMode INT(1) DEFAULT 0,

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