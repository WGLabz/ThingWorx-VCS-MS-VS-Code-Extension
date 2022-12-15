var vscode = require('vscode')
var config = require('../utils/config')
var cache = require('../utils/cache')
var path_;
var lintFromCache;

class EntitiesTreeViewProvider {

    // EVent handlers for refresh
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    loadCache() { cache.getCache().then((val) => lintFromCache = JSON.parse(val).lint); }
    constructor() {
        this.loadCache();
    }
    refresh() {
        this.loadCache();
        this._onDidChangeTreeData.fire();
    }
    getChildren(element) {
        if (element === undefined) {
            return Promise.resolve(this.getDirsOrFiles(vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, `./${config.RELATIVE_PATH}/`)))
        }
        if (element) {
            return Promise.resolve(this.getDirsOrFiles(element.resourceUri))
        }
    }
    getTreeItem(element) {
        return element;
    }
    async getFileCount(bool, path) {
        var files = await vscode.workspace.fs.readDirectory(path);
        description_ = bool ? `` : files.length
    }
    async getDirsOrFiles(path) {
        const data = await vscode.workspace.fs.readDirectory(path);
        return data.map((item) => {
            path_ = path;
            return new TreeItem(
                item[0],
                `23`,
                item[1] === 1 ? vscode.TreeItemCollapsibleState.None : item[0] === `code` ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed
            )
        })
    }
}

class TreeItem extends vscode.TreeItem {
    constructor(
        label,
        version,
        collapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
        this.resourceUri = vscode.Uri.joinPath(path_, label)
        var lintDetails = lintFromCache.find((item) => {
            return item.name.indexOf(label) > -1
        })
        this.description = lintDetails ? `${lintDetails.lint[0].errorCount} Errors ${lintDetails.lint[0].warningCount} Warn` : true
    }
}

module.exports = { EntitiesTreeViewProvider };