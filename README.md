<div align="center">
<img src="public/images/icons/icon.png" alt="Boscouse" width="75"/>

# Boschouse

</div>

## What is it?

Boschouse is an open source digital doorbell that uses Telegram as notification endpoint.

## How it works?

Using a QR code, people can access to your digital doorbell, and they see the list of families in the house, with their members and with the floor where they live in.

Clicking on a family, people can choose to send a notification to all the family members, or only to one or few of them. Then, they can choose to add a message (i.e. who they are). Finally, clicking on the bell, a notification will be sent to the family members through Telegram, from which they can open the door.

Family members can also add a message (using Telegram) that will be displayed in the digital doorbell.

## How to install it?

Clone this repository

```
git clone https://github.com/luca-martinelli-09/boschouse
```

Copy `.env.template` to `.env` and set the required parameters.

- **PORT**: The port where to start the server
- **BASE_URL**: The endpoint website for the digital doorbell
- **NODE_OPEN_DOOR**: The Node-RED endpoint used to open the door (i.e. https://localhost:1880/door/open)
- **NODE_RING**: The Node-RED endpoint used to open the door (i.e. http://localhost:1880/door/ring)
- **DB_HOST**: Database host
- **DB_USER**: Database user
- **DB_PASSWORD**: Database password
- **DB_NAME**: Database table
- **TG_BOT_API**: Telegram bot api token

Using **Docker** (recommended),

```
docker compose build && docker compose up -d
```

Or using NodeJS,

```
npm run build && npm start
```

## Technologies used

- Server [NodeJS](https://nodejs.org/)
- Web Server [ExpressJS](https://expressjs.com/)
- Template Engine [PUG](https://pugjs.org/)
- Database [MySQL](https://www.mysql.com/it/)
- [TailwindCSS](https://tailwindcss.com/)
- [Node-RED](https://nodered.org/)
- [Telegram Bots](https://core.telegram.org/bots/api)
- [Docker](https://www.docker.com/)

## Future improvements

- Sending a message from Telegram, using WebSockets
- Take a photo/video and send it to Telegram
- Extend the service for more houses, with registration/login and manage pages