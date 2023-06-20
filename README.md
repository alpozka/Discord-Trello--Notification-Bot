# Discord Trello  Notification Bot
 This bot reports your trello activities to your discord channels.


# installation
npm install

configure .env file
 
node trellobot.js

# Configuration
id.json file 

The id.json file contains the board id, discord channel id and threadID of the discord channel, which are located in the url of your trello board.

boardID:
https://trello.com/b/HFFFFSS23/example-board is (HFFFFSS23).

id json example:
```json

{
   "HFFFFSS23": {
     "channelId": "111112222223333444",
     "threadId": "111112222223333444"
   }
}