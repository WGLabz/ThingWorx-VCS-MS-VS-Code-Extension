// Library imports
var xml2js = require('xml2js');
var vscode = require('vscode');
var lisntConfigFile = require('../utils/setuplint')
// Local imports
var statusbar = require('../utils/statusbar')
var config = require('../utils/config')
var statusbar = require('../utils/statusbar')
var cache = require('../utils/cache')
let workspaceFolders = vscode.workspace.workspaceFolders;

//  Load directory
let extract = async () => {
    // Read directory
    lisntConfigFile.setup()
    if (workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Now Workspace opened!');
        statusbar.text = '$(error) Select workspace';
        return;
    }
    cache.cacheTimerInit();
    processDirectories(workspaceFolders[0].uri, '')
}


let processDirectories = (uri, fileOrDirectory) => {

    vscode.workspace.fs.readDirectory(vscode.Uri.joinPath(uri, `./${config.RELATIVE_PATH}/entities/`, fileOrDirectory))
        .then((dir) => {
            statusbar.text = '$(export) Extracting Scripts';
            dir.forEach((directory) => {
                if (directory[1] == 2)
                    processDirectories(uri, fileOrDirectory + '/' + directory[0])
                else {
                    // Extract JS files from XML files
                    extractJSFiles(fileOrDirectory, directory[0])
                }
                //
            })
            statusbar.text = 'ThingWorx VCS';
        })
        .catch((err) => { console.log(err) })

}
let extractJSFiles = async (directory, entityname) => {
    var file = vscode.Uri.joinPath(workspaceFolders[0].uri, `./${config.RELATIVE_PATH}/entities/`, directory + '/' + entityname);

    try {
        var content = await vscode.workspace.fs.readFile(file)
        var entitiesJSON = await xml2js.parseStringPromise(content, { explicitArray: true, trim: true });

        entitiesJSON = entitiesJSON.Entities
        // Extract type of Entity
        var type = entitiesJSON.hasOwnProperty('ThingShapes') ? 'ThingShape'
            : entitiesJSON.hasOwnProperty('Things') ? 'Thing'
                : entitiesJSON.hasOwnProperty('ThingTemplates') ? 'ThingTemplate'
                    : entitiesJSON.hasOwnProperty('Mashups') ? 'Mashup'
                        : undefined;

        if (type) {
            let defs = [];
            switch (type) {
                case 'ThingShape':
                    defs = entitiesJSON[type + 's'][0].ThingShape[0].ServiceImplementations[0].ServiceImplementation;
                    break;
                case 'Thing':
                    defs = entitiesJSON[type + 's'][0].Thing[0].ThingShape[0].ServiceImplementations[0].ServiceImplementation;
                    break;
                case 'ThingTemplate':
                    defs = entitiesJSON[type + 's'][0].ThingTemplate[0].ThingShape[0].ServiceImplementations[0].ServiceImplementation;
                    break;
                case 'Mashup':
                    // console.log(entitiesJSON[type + 's'][0][type][0].mashupContent[0], type)
                    break;
                default:
                    break;
            }
            writeJSFiles(defs, entityname, type + 's');
        }
    } catch (err) { console.log(entityname, err) }
}
let writeJSFiles = (services, entityName, type) => {

    if (services) {
        services.map(async (service) => {
            var name = service.$.name;
            let isSQL = service.$.handlerName === "SQLQuery";
            var code = isSQL ? service.ConfigurationTables[0].ConfigurationTable[0].Rows[0].Row[0].sql[0] : service.ConfigurationTables[0].ConfigurationTable[0].Rows[0].Row[0].code[0]
            try {
                // Write to File
                var filePathURI = vscode.Uri.joinPath(workspaceFolders[0].uri, `./${config.RELATIVE_PATH}/code/${type}/${entityName.replace('.xml', '')}/${name}${isSQL ? '.sql' : '.js'}`);

                await vscode.workspace.fs.writeFile(filePathURI, new TextEncoder().encode(code))
                cache.updateLintCache({
                    code: code,
                    name: `${name}${isSQL ? '.sql' : '.js'}`, 
                    path: filePathURI.fsPath
                });
            } catch (e) { console.error(e) }
        })

    }

}
module.exports = { extract }
