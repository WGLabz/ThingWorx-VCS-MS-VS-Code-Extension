var vscode = require('vscode');
var path = require('path')
var cache = require('../utils/cache')
var config = require('../utils/config')
const { DateTime } = require("luxon");

var git = require('../utils/git')

// const gitExtension = vscode.extensions.getExtension('vscode.git').exports;
// const api = gitExtension.getAPI(1);

var setWebViewContent = async (context, panel) => {
    // Read the JSOn cache file from temp folder or workspace
    var jsonContent = await cache.getCache();
    jsonContent = JSON.parse(jsonContent);

    // Get teh CSS stylesheet for the UI
    const cssFile = panel.webview.asWebviewUri(vscode.Uri.file(
        path.join(context.extensionPath, 'src/static/css', 'style.css')
    ));

    var lastUpdate = DateTime.fromSeconds(jsonContent.thingworx.lastupdate).toFormat('HH:MM dd LLL yyyy')

    // Fetch the last commit details
    var commit = await git.last_commit();

    // Render the HTMl content
    panel.webview.html = `
                            <html lang="en">

                            <head>
                                <meta charset="utf-8">
                                <link href="${cssFile}" rel="stylesheet">
                                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css"
                                    integrity="sha512-xh6O/CkQoPOWDdYTDqeRdPCVd1SpvCA9XXcUnZS2FmJNp1coAFzvtCN9BmamE+4aHK8yyUHUSCcJHgXloTyT2A=="
                                    crossorigin="anonymous" referrerpolicy="no-referrer" />
                                <meta name="viewport" content="width=device-width, initial-scale=1">
                                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" rel="stylesheet"
                                    integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi" crossorigin="anonymous">
                                <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js"
                                    integrity="sha512-CryKbMe7sjSCDPl18jtJI5DR5jtkUWxPXWaLCst6QjH8wxDexfRJic2WRmRXmstr2Y8SxDDWuBO6CQC6IE4KTA=="
                                    crossorigin="anonymous" referrerpolicy="no-referrer"></script>
                            </head>

                            <body style="padding: 0">
                           
                                <section id="topbar" class="d-flex align-items-center" style="background-color: #03045e;">
                                    <div class="container d-flex justify-content-center justify-content-md-between">
                                        <div class="d-flex">
                                            ThingWorx VCS
                                        </div>
                                        <div class="social-links d-none d-md-flex align-items-center">
                                            <i class="fa fa-server mx-2"> </i> <small> ${config.SERVER_URL} </small>
                                            <i class="fa fa-clock-rotate-left mx-2"> </i> <small> ${lastUpdate} </small>
                                        </div>
                                    </div>
                                    
                                    <button type="button" class="btn btn-success btn-sm" title="Download and extract entities." style="margin: 5px" onclick="fetchAndExtract()" id="fetch-button">
                                    <small><i class="fa fa-download"> </i>  Fetch</small>
                                </button>
                                </section>
                                <section id="topbar" class="d-flex align-items-center" style="background-color: #0077b6; height: 20px;">
                                <div class="container d-flex" >
                                <small>
                                <i class="fa fa-code-branch" style="margin: 5px"> </i>   ${commit.branch}
                                <i class="fa fa-code-commit" style="margin: 5px"> </i>   ${commit.message} by <span title="${commit.email}">${commit.author} </span>${DateTime.fromJSDate(commit.date).toFormat('HH:MM dd LLL yyyy')}
                                <i class="fa fa-code-compare" style="margin: 5px"> </i>   ${commit.diff.length} Active changes
                                </small>
                                </div>
                                <button type="button" class="btn btn-secondary btn-sm" onclick="pullCode()" disabled>
                                Pull
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="pushCode()" disabled>
                           Push
                        </button>
                            </section>
                                <main id="main" class="mt-2">
                                    <div class="container">

                                        <button type="button" class="btn btn-primary btn-sm">
                                            Project <span class="badge bg-dark">${jsonContent.thingworx.entities.thing} </span>
                                        </button>
                                        <button type="button" class="btn btn-info btn-sm">
                                            Thing <span class="badge bg-dark">${jsonContent.thingworx.entities.project} </span>
                                        </button>
                                        <button type="button" class="btn btn-secondary btn-sm">
                                            Template <span class="badge bg-dark">${jsonContent.thingworx.entities.thingtemplate}</span>
                                        </button>
                                        <button type="button" class="btn btn-danger btn-sm">
                                            Shape <span class="badge bg-dark">${jsonContent.thingworx.entities.thingshape} </span>
                                        </button>
                                        <button type="button" class="btn btn-success btn-sm">
                                            Appkey <span class="badge bg-dark">${jsonContent.thingworx.entities.appkeys} </span>
                                        </button>
                                        <button type="button" class="btn btn-warning btn-sm">
                                            Media <span class="badge bg-dark">${jsonContent.thingworx.entities.media} </span>
                                        </button>
                                        <button type="button" class="btn btn-success btn-sm">
                                            State <span class="badge bg-dark">${jsonContent.thingworx.entities.statedefs} </span>
                                        </button>
                                        <button type="button" class="btn btn-danger btn-sm">
                                            Style <span class="badge bg-dark">${jsonContent.thingworx.entities.styledefs} </span>
                                        </button>

                                    </div>
                                    <div class="container">
                                    </div>
                                    </div>
                                </main><!-- End #main -->


                                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js"
                                    integrity="sha384-OERcA2EqjJCMA+/3y+gxIOqMEjwtxJY7qPCqsdltbNJuaOe923+mo//f6V8Qbsw3"
                                    crossorigin="anonymous"></script>
                                <script>
                                const vscode = acquireVsCodeApi();
                               function  pushCode(){
                                    vscode.postMessage({
                                        command: 'git-push',
                                        text: 'Push code'
                                    });
                                }
                                
                                function pullCode(){
                                    vscode.postMessage({
                                        command: 'git-pull',
                                        text: 'Pull code'
                                    });
                                }
                                function fetchAndExtract(){
                                    document.getElementById('fetch-button').disabled = true;
                                    vscode.postMessage({
                                        command: 'twx-fetch',
                                        text: 'Fetch and Extract thingeorx entities.'
                                    });
                                }
                                // Message handling from the extension
                                window.addEventListener('message', event => {
                                    switch (event.data.command) {
                                        case 'twx-fetch-done':
                                            document.getElementById('fetch-button').disabled = false;
                                            break;
                                    }
                                });
                                </script>
                            </body>
                            </html>
    
    `
}

module.exports = { setWebViewContent }