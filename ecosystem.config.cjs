module.exports = {
  apps: [{
    name: "book-exchange-bot",
    script: "index.js",
    watch: ["src", "index.js"],
    ignore_watch: ["node_modules", "logs"],
    env_file: ".env",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "logs/error.log",
    out_file: "logs/output.log"
  }]
};