// wrapper for the database service

module.exports = async (ipc, name, ...args) => {
  return ipc.command("database", { name, args }, true);
};
