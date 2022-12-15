// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode')
var http = require('./src/http/thingworx.js')
var statusbar = require('./src/utils/statusbar')
var extractor = require('./src/thingworx/extract')

var enetitieTreeDataProvier = require('./src/providers/treeprovider')

var webViewContentProvider = require('./src/stats/webviewcontent')
// This method is called when your extension is activated
// Your extension is activated the ver				y first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Command to start export from thingWorx server
	let entityPullAndExtractCommand = vscode.commands.registerCommand('thingworxvcs.export', function () {
		// The code you place here will be executed every time your command is executed
		statusbar.text = '$(accounts-view-bar-icon~spin)Pulling entities';
		http.exportEntities('DBFinder', false);
		setTimeout(() => { http.getDownloadableZipFileLink(false) }, 5000);
	});
	context.subscriptions.push(entityPullAndExtractCommand);

	// Command to extract content from the downloaded .zip file
	let entitiesExtractionCommand = vscode.commands.registerCommand('thingworxvcs.extract', function () {
		// The code you place here will be executed every time your command is executed
		extractor.extract()
	});
	context.subscriptions.push(entitiesExtractionCommand);

	// Command to activate the extension
	let activateExtension = vscode.commands.registerCommand('thingworxvcs.activate', function () {
		vscode.window.showInformationMessage('ThingWorx VCS extension started!');
	});
	context.subscriptions.push(activateExtension);

	//  Dont see any usage now can be used mopre efficiently later
	// Tree View for the extension to show extracted and non-extracted entities
	var entitiesDataProvider = new enetitieTreeDataProvier.EntitiesTreeViewProvider();
	var treeView = vscode.window.createTreeView('entities', {
		treeDataProvider: entitiesDataProvider,
		showCollapseAll: true
	});

	vscode.commands.registerCommand('thingworxvcs.refresh', function () {
		entitiesDataProvider.refresh()
	});

	treeView.onDidChangeSelection(async (e) => {
		var file = e.selection[0].resourceUri
		var name = e.selection[0].label;
		console.log(name)
		if (name.indexOf('.js') > -1 || name.indexOf('.sql') > -1 || name.indexOf('.xml') > -1)
			await vscode.commands.executeCommand('vscode.open', file);
	})

	// For the WebView
	let currentPanel = undefined;
	webViewCommand = vscode.commands.registerCommand('thingworxvcs.stats', () => {
		const columnToShowIn = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (currentPanel) {
			// If we already have a panel, show it in the target column
			currentPanel.reveal(columnToShowIn);
		} else {
			// Create and show a new webview
			currentPanel = vscode.window.createWebviewPanel(
				'codestats', // Identifies the type of the webview. Used internally
				'ThingWorx Entities Details', // Title of the panel displayed to the user
				vscode.ViewColumn.One, // Editor column to show the new webview panel in.
				{
					// Enable scripts in the webview
					enableScripts: true
				}// Webview options. More on these later.
			);
			webViewContentProvider.setWebViewContent(context, currentPanel);
			currentPanel.onDidDispose(
				() => {
					currentPanel = undefined;
				},
				undefined,
				context.subscriptions
			);

			// Messaging to the WEB UI
			currentPanel.webview.onDidReceiveMessage(
				message => {
					switch (message.command) {
						case "git-push":
							break;
						case "git-pull":
							break;
						case "twx-fetch":
							vscode.window.showInformationMessage('Entities will be downloaded and services will be extracted.')
							vscode.commands.executeCommand("thingworxvcs.export").then(()=>{
								vscode.commands.executeCommand("thingworxvcs.extract").then(() => {
									currentPanel.webview.postMessage({ command: 'twx-fetch-done' });
								})
							})
							break;
						default:
							break;
					}
				},
				undefined,
				context.subscriptions
			);
		}
	})
	context.subscriptions.push(
		webViewCommand
	);


}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
