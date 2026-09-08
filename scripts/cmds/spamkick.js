 module.exports.config = {
  name: "spamkick",
  version: "1.2.0",
  role: 2, 
  author: "Saif",
  usePrefix: true,
  description: { 
      en: "Kick spammers automatically (admins are safe)."
  },
  category: "box chat",
  guide: { en:"[on/off]"},
  countDown: 30
};

module.exports.onChat = async ({ api, event, usersData, commandName }) => {
  const { senderID, threadID } = event;
  if (!global.antispam || !global.antispam.has(threadID)) {
  return;
  }

  const threadInfo = global.antispam.has(threadID) ? global.antispam.get(threadID) : { users: {} };

  if (!(senderID in threadInfo.users)) {
    threadInfo.users[senderID] = { count: 1, time: Date.now() };
  } else {
    threadInfo.users[senderID].count++;
    const timePassed = Date.now() - threadInfo.users[senderID].time;
    const messages = threadInfo.users[senderID].count;
    const timeLimit = 80000; 
    const messageLimit = 5; 

    if (messages > messageLimit && timePassed < timeLimit) {
      // বটের এডমিন বাদ দাও
      if (global.GoatBot.config.adminBot.includes(senderID)) return;

      // গ্রুপ অ্যাডমিন বাদ দাও
      const info = await api.getThreadInfo(threadID);
      let adminIDs = [];
      if (Array.isArray(info.adminIDs)) {
        // কখনও adminIDs = ["123","456"] আবার কখনও [{id:"123"}] হতে পারে
        adminIDs = info.adminIDs.map(a => (typeof a === "object" ? a.id : a));
      }
      if (adminIDs.includes(senderID)) return;

      // কিক করা হচ্ছে
      api.removeUserFromGroup(senderID, threadID, async (err) => {
        if (err) return console.error(err);

        api.sendMessage({
          body: `${await usersData.getName(senderID)} has been removed for spamming.\nUser ID: ${senderID}\nReact on this message to add them again.`
        }, threadID, (error, infoMsg) => {
          if (!error) {
            global.GoatBot.onReaction.set(infoMsg.messageID, { 
              commandName, 
              uid: senderID,
              messageID: infoMsg.messageID
            });
          }
        });
      });

      threadInfo.users[senderID] = { count: 1, time: Date.now() };
    } else if (timePassed > timeLimit) {
      threadInfo.users[senderID] = { count: 1, time: Date.now() };
    }
  }

  global.antispam.set(threadID, threadInfo);
};

module.exports.onReaction = async ({ api, event, Reaction, threadsData, usersData , role }) => {
  const { uid, messageID } = Reaction;
  const { adminIDs, approvalMode } = await threadsData.get(event.threadID);
  const botID = api.getCurrentUserID();
  if (role < 1) return;
  var msg = "";

  try {
    await api.addUserToGroup(uid, event.threadID);

    const admins = adminIDs.map(a => (typeof a === "object" ? a.id : a));
    if (approvalMode === true && !admins.includes(botID)){
      msg += `Successfully added ${await usersData.getName(uid)} to approval list.`;
      await api.unsendMessage(messageID);
    }
    else{
      msg += `Successfully added ${await usersData.getName(uid)} to this group.`;
      await api.unsendMessage(messageID);
    }
  }
  catch (err) {
    msg += `Failed to add ${await usersData.getName(uid)} to this group.`;
  }
  console.log(msg);
};

module.exports.onStart = async ({ api, event, args }) => {
  switch ((args[0] || "").toLowerCase()) {
    case "on":
      if (!global.antispam) global.antispam = new Map();
      global.antispam.set(event.threadID, { users: {} });
      api.sendMessage("✅ Spam kick has been turned ON for this Group.", event.threadID, event.messageID);
      break;
    case "off":
      if (global.antispam && global.antispam.has(event.threadID)) {
        global.antispam.delete(event.threadID);
        api.sendMessage("❌ Spam kick has been turned OFF for this Group.", event.threadID, event.messageID);
      } else {
        api.sendMessage("⚠️ Spam kick is not active in this Group.", event.threadID, event.messageID);
      }
      break;
    default:
      api.sendMessage("Please use:\n- 'on' to activate\n- 'off' to deactivate the Spam kick.", event.threadID, event.messageID);
  }
};
