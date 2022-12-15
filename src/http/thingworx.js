// Library imports
const axios = require('axios');
var vscode = require('vscode');
const extract = require('extract-zip')

//Local Imports
var statusbar = require('../utils/statusbar')
var config = require('../utils/config')

// URLS
const EXPORT_SERVICE_URL = `${config.SERVER_URL}/Thingworx/Resources/SourceControlFunctions/Services/ExportSourceControlledEntitiesToZipFile`
const ENTITIES_ZIP_FILE_LINK = `${config.SERVER_URL}/Thingworx/FileRepositories/SystemRepository/twxvcs/entities.zip`;

var exportEntities = (projectName, showUserMessage = false) => {
    var postParams = {
        "repositoryName": "SystemRepository",
        "path": "twxvcs/",
        "name": "entities",
        "tags": [],
        "projectName": projectName,
        "includeDependents": false,
        "exportMatchingModelTags": false
    };
    statusbar.text = '$(export) Exporting';
    axios.post(EXPORT_SERVICE_URL, postParams, { headers: { appkey: config.APP_KEY } })
        .then(() => {
            if (showUserMessage)
                vscode.window.showInformationMessage('Entity export has started.')
            statusbar.text = '$(export) Export complete';

        })
        .catch((err) => {
            if (showUserMessage)
                vscode.window.showErrorMessage('Entity export failed. ' + err)
            statusbar.text = '$(error-small) Export error';

        })
}

async function writeAndExtractEntities(buffer) {

    let workspaceFolders = vscode.workspace.workspaceFolders;
    statusbar.text = '$(file-zip) Unzipping';

    if (workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Now Workspace opened!');
        statusbar.text = '$(error) Select workspace';
        return;
    }
    // Remove the content of the folder -- Not working yet
    // await vscode.workspace.fs.delete(vscode.Uri.joinPath(workspaceFolders[0].uri, './.thingworx/'), true, true);

    // Cretae teh URI for the temp fiel in workspace
    var tempZipFileURI = vscode.Uri.joinPath(workspaceFolders[0].uri, `./${config.RELATIVE_PATH}/ha.zip`);

    // Write the recieved array buffer to a temp file in workspace
    await vscode.workspace.fs.writeFile(tempZipFileURI, buffer)

    // Extract the downloaded .zip file
    await extract(tempZipFileURI.fsPath, { dir: workspaceFolders[0].uri.fsPath + `/${config.RELATIVE_PATH}/entities` });

    // Remove the downloaded .zip file.
    await vscode.workspace.fs.delete(tempZipFileURI, false, false);
    vscode.window.showInformationMessage('Entities downloaded and extracted sucessfully');
    statusbar.text = '$(pass-filled) Complete';

}

var getDownloadableZipFileLink = (showUserMessage = false) => {
    statusbar.text = '$(desktop-download) Downloading';

    if (showUserMessage)
        vscode.window.showInformationMessage('Starting Download');

    axios.get(ENTITIES_ZIP_FILE_LINK, { headers: { appkey: config.APP_KEY, 'Content-Type': 'application/zip' }, responseType: 'arraybuffer' })
        .then((res) => {
            if (!res.data) {
                vscode.window.showWarningMessage('No .zip file found for entities.');
                return;
            }
            writeAndExtractEntities(res.data);

        })
        .catch((err) => {
            if (showUserMessage)
                vscode.window.showErrorMessage('Zip file download failed. ' + err)
            statusbar.text = '$(error) Download error';
        })

}


module.exports = { exportEntities, getDownloadableZipFileLink }
