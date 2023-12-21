# DiscordGemini

Clone the repository.
Rename .env.template file to .env in the root directory and fill in the following properties:
DISCORD_TOKEN: Create a bot, selecting 'New Application' and following the steps to 'Create'. Once created, click 'Bot' on the left menu, 'Add Bot', then 'View Token'. The token that pops up should be coppied and pasted into the .env file, replacing YOUR_DISCORD_BOT_TOKEN.
CLIENT_ID: View your applications, select your bot, click 'OAuth2', copy client id and paste into the .env file, replacing YOUR_CLIENT_ID.
OPENAI_API_KEY: Open the API Keys page and create/login to an account, click 'Create new secret key' which allows you to copy the key and paste it into the .env file, replacing YOUR_OPENAI_API_KEY.
DISCORD_CHANNEL_ID: Right-click the desired channel for your bot to speak in, selecting the bottom most option 'Copy ID' and paste it into the .env file, replacing YOUR_DISCORD_CHANNEL_ID.
Edit prompt-template.js (optional) and rename to prompt.js
When editing prompt.js ensure that each message is in the format provided in the template {role: "<whatever_role>", content: '<your_message>'}, see OpenAI's Documentation.
Install dependencies by running npm install.
Start the application with node index.js.
Click or copy the URL in your console into the browser and select the server you want your bot to be invited into.
Chat with your bot in the channel you've determined in .env!
