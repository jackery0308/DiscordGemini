const { Events, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.Gemini_API_KEY);

// Load local Database
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const prompt = require('./prompt.js');
const { channel } = require('diagnostics_channel');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const historyDbFilePath = path.join(__dirname, 'history.json');
const memoryBankFilePath = path.join(__dirname, '..', 'commands', 'memoryBank.json');

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.channelId == process.env.DISCORD_CHANNEL_ID && !message.author.bot && !message.system) {
			let content = message.content;
			let author = message.author;
			let nickname = message.member.nickname || author.username;
			let id = author.id;
			let cleanMessage = content.replace(/<@(\d+)>/gi, ($0, $1) => {
			return `<@${nickname}>`;
			});
			let currentMessage = {role: "user", content: cleanMessage};
			let currentAuthor = {role: "system", content: `${nickname}:`}
			let historyLength = 20;
			let history = [];
			try {
			  const dbData = await readFileAsync(historyDbFilePath, { encoding: 'utf8' });
			  history = JSON.parse(dbData);
			} catch (error) {
			  if (error.code !== 'ENOENT') {
				console.error(error);
			  }
			}

			if (!Array.isArray(history)) {
				history = [];
			}

			let memoryBank = [];
			try {
			  const dbData = await readFileAsync(memoryBankFilePath, { encoding: 'utf8' });
			  memoryBank = JSON.parse(dbData);
			} catch (error) {
			  if (error.code !== 'ENOENT') {
				console.error(error);
			  }
			}

			if (!Array.isArray(memoryBank)) {
				memoryBank = [];
			}
			// To add date to the message //
			// let d = new Date(message.createdTimestamp);
			// let date = new Intl.DateTimeFormat('en-GB', { 
			// 	year: 'numeric',
			// 	month: '2-digit',
			// 	day: '2-digit',
			// 	hour: '2-digit',
			// 	minute: '2-digit',
			// 	second: '2-digit',
			// 	hour12: false
			// }).format(d);
			//let timestamp = `[${date}]`;

			const desiredLength = 1000;
			while (`${cleanMessage}`.length > desiredLength) {
			cleanMessage = `${cleanMessage}`.slice(0, -1);
			}
			let conversation = prompt(message, nickname);
			conversation = conversation.concat(memoryBank);
			conversation = conversation.concat(history);
			conversation.push(prompt(message, nickname)[prompt.length - 1]);
			conversation.push(currentAuthor);
			conversation.push(currentMessage);
			let completionIndex = 3;
			let responseSent = false;
			while (completionIndex != 0 && !responseSent) {
				message.channel.sendTyping();
				completionIndex--;

				const model = genAI.getGenerativeModel({ model: "gemini-pro"});
				try {
					const result = await model.generateContent(message.content);
					const response = await result.response;
				
					// Check for successful generation
					if (response.promptFeedback.blockReason == null) {
						messageResponse = response.text();
						console.log(messageResponse);
					} 
					else {
					  // Handle specific error types
					  if (response.promptFeedback.blockReason === "SAFETY") {
						console.error("Text blocked due to safety concerns. Please rephrase your prompt.");
						messageResponse = "Your request generated content that violates safety guidelines. Please try again with a different prompt.";
					  } else if (response.promptFeedback.blockReason === "MODEL_UNAVAILABLE") {
						console.error("Model unavailable. Please try again later.");
						messageResponse = "The model is currently unavailable. Please try again later.";
					  } else {
						// General error handling
						console.error("Generation failed", response.error);
						messageResponse = `An error occurred while generating content: ${response.error.message}`;
					  }
					}

					//let response = completion.data.choices[0].message;
					conversation = conversation + messageResponse;
					history.push(currentAuthor, currentMessage, messageResponse);
					if (history.length > historyLength) {
					history = history.slice(history.length - historyLength);
					}
					try {
					await writeFileAsync(historyDbFilePath, JSON.stringify(history), { encoding: 'utf8' });
					} catch (error) {
					console.error(error);
					}
					messageResponse = await message.channel.send({
						channel_id: `DISCORD_CHANNEL_ID`,
						content: [
							messageResponse
						].join('\n'),
						tts: false,
						allowedMentions: { // "allowed_mentions" with this parameter prevents a ping
							repliedUser: false
						},
						reply: {
							messageReference: message.id
							}
						});
					responseSent = true;
					return messageResponse;
				} catch (err) {
					console.error(err);
				}
			}
		}
	},
};