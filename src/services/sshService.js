require("dotenv").config();
// src/services/sshService.js
const { Client } = require("ssh2");

function runSSHCommand(command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) return reject(err);

          let output = "";

          stream
            .on("close", (code) => {
              conn.end();
              resolve(output);
            })
            .on("data", (data) => {
              output += data.toString();
            })
            .stderr.on("data", (data) => {
              output += data.toString();
            });
        });
      })
      .connect({
        host: process.env.SSH_HOST,
        port: process.env.SSH_PORT || 22,
        username: process.env.SSH_USER,
        password: process.env.SSH_PASSWORD,
      });
  });
}

module.exports = { runSSHCommand };
