const { runSSHCommand } = require("./sshService");

class AsteriskManager {
  /**
   *Create a PJSIP extension
   */
  static async createExtension(ext, secret, cliNumber) {
    let callerid = cliNumber.includes("<") ? cliNumber : `<${cliNumber}>`;

    const authBlock = `
[${ext}]
type=auth
auth_type=userpass
username=${ext}
password=${secret}
`;

    const aorBlock = `
[${ext}]
type=aor
max_contacts=1
`;

    const endpointBlock = `
[${ext}]
type=endpoint
aors=${ext}
auth=${ext}
callerid=${callerid}
context=from-internal
disallow=all
allow=ulaw
allow=alaw
`;

    const cmd = `
echo "${authBlock.replace(/"/g, '\\"')}" >> /etc/asterisk/pjsip.auth_custom_post.conf
echo "${aorBlock.replace(/"/g, '\\"')}" >> /etc/asterisk/pjsip.aor_custom_post.conf
echo "${endpointBlock.replace(/"/g, '\\"')}" >> /etc/asterisk/pjsip.endpoint_custom_post.conf
fwconsole reload
`;

    return await runSSHCommand(cmd);
  }

  /**
   * Update Caller ID
   */
  static async updateCallerID(ext, newCallerID) {
    let callerid = newCallerID.includes("<") ? newCallerID : `<${newCallerID}>`;
    const file = "/etc/asterisk/pjsip.endpoint_custom_post.conf";

    const cmd = `
sed -i "/\\[${ext}\\]/,/^\\[/ s/^callerid=.*/callerid=${callerid}/" ${file}
fwconsole reload
`;

    return await runSSHCommand(cmd);
  }

  /**
   * Delete a PJSIP extension
   */
  static async deleteExtension(ext) {
    const authFile = "/etc/asterisk/pjsip.auth_custom_post.conf";
    const aorFile = "/etc/asterisk/pjsip.aor_custom_post.conf";
    const endpointFile = "/etc/asterisk/pjsip.endpoint_custom_post.conf";

    const cmd = `
sed -i "/\\[${ext}-auth\\]/,/^\\[/d" ${authFile}
sed -i "/\\[${ext}-aor\\]/,/^\\[/d" ${aorFile}
sed -i "/\\[${ext}-endpoint\\]/,/^\\[/d" ${endpointFile}
fwconsole reload
`;

    return await runSSHCommand(cmd);
  }
}

module.exports = AsteriskManager;
