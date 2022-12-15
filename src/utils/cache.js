// Import ESlint for linting
const { ESLint } = require("eslint");
var vscode = require('vscode');
var Timer = require("easytimer.js").Timer;
var eslint = undefined;
// Global Variables
const cacheJSONFilePath = `.thingworxvcs/cache.json`;
let workspaceFolders = vscode.workspace.workspaceFolders;
var lintCache = [];
var cacheWriteTimer = undefined
var evenListnerExists = false;

var cacheTimerInit = () => {
    lintCache = [];
    cacheWriteTimer = cacheWriteTimer || new Timer();
    cacheWriteTimer.start({ countdown: true, startValues: { seconds: 5 } })
    if (!evenListnerExists) {
        evenListnerExists = true;
        cacheWriteTimer.addEventListener('targetAchieved', function () {
            updateCacheInFS()
            cacheWriteTimer.stop();
        });

        cacheWriteTimer.addEventListener('secondsUpdated', function () {
            console.log(cacheWriteTimer.getTimeValues().toString());
        });
    }
}

var updateLintCache = async (info) => {

    var options = { 'cwd': workspaceFolders[0].uri.fsPath };

    eslint = eslint ? eslint : new ESLint(options)

    info.lint = await eslint.lintText(info.code);

    lintCache = [...lintCache, info]
    cacheWriteTimer.reset()
}
var updateCacheInFS = async () => {
    var cacheFile = vscode.Uri.joinPath(workspaceFolders[0].uri, `${cacheJSONFilePath}`);
    var cache = {};
    try {
        var cache = await vscode.workspace.fs.readFile(cacheFile) || {};
        cache = JSON.parse(cache)
    }
    catch (e) { console.log(e) }
    cache.lint = lintCache;
    await vscode.workspace.fs.writeFile(cacheFile, new TextEncoder().encode(JSON.stringify(cache)))
}

var getCache =  () => {
    var cacheFile = vscode.Uri.joinPath(workspaceFolders[0].uri, `${cacheJSONFilePath}`);
    return Promise.resolve(vscode.workspace.fs.readFile(cacheFile));
}
module.exports = { updateLintCache, cacheTimerInit, getCache }
