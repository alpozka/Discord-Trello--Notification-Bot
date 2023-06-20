# Discord Trello  Notification Bot
 This bot reports your trello activities to your discord channels.

 This bot allows you to connect the trello boards you want to the threads of the discord channel you specify.

Reported trello board actions are as follows:

| Trello Card Actions            | Trello List Actions     |
|--------------------------------|-------------------------|
| Creating a card                | Creating a list         |
| Card movements                 | List name change        |
| Changes to card titles         | Archiving the list      |
| Archiving of cards             |                         |
| Deleting cards                 |                         |
| Adding comments to cards       |                         |

This bot allows you to send trello board actions as a notification to your discord channel threads as embed messages.


# installation
npm install

configure .env file

node trellobot.js

# Configuration
**Automatic Configuration:**
When you call the "/newtrello" command in the thread area of your Discord channel, it is sufficient to enter the trello board id, discord channel id and threadID information in the text box.

**Manuel Configuration:**

You can add the trello board id, discord channel id and threadID information to the id.json file.
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