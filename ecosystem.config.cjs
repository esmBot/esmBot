module.exports = {
  apps: [
    {
      name: "esmBot",
      script: "dist/cluster/node.js",
      node_args: "--env-file-if-exists=.env",
      autorestart: true,
      exp_backoff_restart_delay: 1000,
      watch: false,
      exec_mode: "fork",
    },
  ],
};
