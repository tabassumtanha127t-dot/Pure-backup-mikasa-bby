module.exports = {
  config: {
    name: "spam",
    author: "Mikasa",
    role: 2,
    shortDescription: "Bulk messaging disabled",
    longDescription: "Bulk messaging is disabled to protect the account.",
    category: "utility",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    return api.sendMessage(
      "Bulk messaging is disabled to protect this account from spam restrictions.",
      event.threadID
    );
  }
};
