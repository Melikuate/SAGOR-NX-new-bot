const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
const handlerEvents = require(process.env.NODE_ENV == 'development' ? "./handlerEvents.dev.js" : "./handlerEvents.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);
// সব কমান্ডের নাম লোড করার ফাংশন
const getAllCommandNames = () => {
const commandNames = [];
for (const cmd of global.GoatBot.commands.values()) {
if (cmd.config && cmd.config.name) {
commandNames.push(cmd.config.name.toLowerCase());
// যদি aliases থাকে, সেগুলোও যোগ করুন
if (cmd.config.aliases && Array.isArray(cmd.config.aliases)) {
commandNames.push(...cmd.config.aliases.map(a => a.toLowerCase()));
}
}
}
return commandNames;
};
return async function (event) {
// Check if the bot is in the inbox and anti inbox is enabled
if (
global.GoatBot.config.antiInbox == true &&
(event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
(event.senderID || event.userID || event.isGroup == false)
)
return;


	// 🔥 BAN CHECK

if (global.bannedUsers?.[event.senderID]) return;

// 🔇 MUTE CHECK WITH TIMER
const muteTime = global.mutedUsers?.[event.senderID];
if (muteTime) {
if (Date.now() < muteTime) return;
else delete global.mutedUsers[event.senderID];
}

// --- [ START: IMPROVED NO PREFIX SYSTEM ] ---  
	// No Prefix মোড চেক এবং শুধুমাত্র নির্দিষ্ট কমান্ডের জন্য প্রিফিক্স যোগ করা  
	if (global.GoatBot.config.noPrefixMode && event.body && !event.body.startsWith(global.GoatBot.config.prefix)) {  
		const messageBody = event.body.trim().toLowerCase();  
		const commandNames = getAllCommandNames();  

		// মেসেজের প্রথম শব্দটি বের করা  
		const firstWord = messageBody.split(/\s+/)[0] || '';  

		// চেক করা যে প্রথম শব্দটি কোনো কমান্ডের নাম কিনা  
		if (commandNames.includes(firstWord)) {  
			// শুধুমাত্র ম্যাচ করা কমান্ডের জন্য প্রিফিক্স যোগ করা  
			event.body = global.GoatBot.config.prefix + event.body;  
			console.log(`No Prefix: Command "${firstWord}" detected, prefix added`);  
		}  
		// এলোমেলো টেক্সট, ইমোজি, লিংক ইগনোর করা হবে  
	}  
	// --- [ END: IMPROVED NO PREFIX SYSTEM ] ---  
const message = createFuncMessage(api, event);  
	await handlerCheckDB(usersData, threadsData, event);  
	const handlerChat = await handlerEvents(event, message);  
	if (!handlerChat)  
		return;  

	const {  
		onAnyEvent, onFirstChat, onStart, onChat,  
		onReply, onEvent, handlerEvent, onReaction,  
		typ, presence, read_receipt  
	} = handlerChat;  


	onAnyEvent();  
	switch (event.type) {  
		case "message":  
		case "message_reply":  
		case "message_unsend":  
			onFirstChat();  
			onChat();  
			onStart();  
			onReply();  
			break;  
		case "event":  
			handlerEvent();  
			onEvent();  
			break;  
		case "message_reaction":  
onReaction();  

const { delete: del, kick, mute, unmute, warn, ban, unban } = global.GoatBot.config?.reactBy || {};  

// DELETE  
if (del?.includes(event.reaction)) {  
	if (event.senderID === api.getCurrentUserID()) {  
		if (global.GoatBot.config?.adminBot?.includes(event.userID)) {  
			api.unsendMessage(event.messageID);  
		}  
	}  
}  

// KICK  
if (kick?.includes(event.reaction)) {  
	if (global.GoatBot.config?.adminBot?.includes(event.userID)) {  
		api.removeUserFromGroup(event.senderID, event.threadID, err => {  
			if (err) return console.log(err);  
		});  
	}  
}  

// MUTE  
if (mute?.includes(event.reaction)) {  
	if (global.GoatBot.config?.adminBot?.includes(event.userID)) {  
		global.mutedUsers ??= {};  
		global.mutedUsers[event.senderID] = Date.now() + 10 * 60 * 1000;  

		api.sendMessage("🔇 User muted (10 min)", event.threadID);  
	}  
}  

// UNMUTE  
if (unmute?.includes(event.reaction)) {  
	if (global.GoatBot.config?.adminBot?.includes(event.userID)) {  
		delete global.mutedUsers?.[event.senderID];  
		api.sendMessage("🔊 User unmuted", event.threadID);  
	}  
}  

// WARN  
if (warn?.includes(event.reaction)) {  
	if (global.GoatBot.config?.adminBot?.includes(event.userID)) {  
		global.warnUsers ??= {};  
		global.warnUsers[event.senderID] = (global.warnUsers[event.senderID] || 0) + 1;  

		const count = global.warnUsers[event.senderID];  
		api.sendMessage("⚠️ Warning: " + count + "/3", event.threadID);  

		if (count >= 3) {  
			api.removeUserFromGroup(event.senderID, event.threadID);  
			delete global.warnUsers[event.senderID];  
		}  
	}  
}  

// BAN  
if (ban?.includes(event.reaction)) {  
	if (global.GoatBot.config?.adminBot?.includes(event.userID)) {  
		global.bannedUsers ??= {};  
		global.bannedUsers[event.senderID] = true;  

		api.sendMessage("⛔ User banned", event.threadID);  
	}  
}  

// UNBAN  
if (unban?.includes(event.reaction)) {  
	if (global.GoatBot.config?.adminBot?.includes(event.userID)) {  
		delete global.bannedUsers?.[event.senderID];  
		api.sendMessage("✅ User unbanned", event.threadID);  
	}  
}  

					 break;  
		case "typ":  
			typ();  
			break;  
		case "presence":  
			presence();  
			break;  
		case "read_receipt":  
			read_receipt();  
			break;  
		// case "friend_request_received":  
		// { /* code block */ }  
		// break;  

		// case "friend_request_cancel"  
		// { /* code block */ }  
		// break;  
		default:  
			break;  
	}  
};

};