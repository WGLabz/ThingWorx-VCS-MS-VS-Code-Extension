var vscode = require('vscode')

var statusbar = vscode.window.createStatusBarItem()
statusbar.alignment = 'left'
statusbar.text = 'ThingWorx VCS'
statusbar.command = "thingworxvcs.stats"
statusbar.show();

module.exports = statusbar 
