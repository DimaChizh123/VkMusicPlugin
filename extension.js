const vscode = require('vscode');
const ver = 5.199;
let timer_id;
let current_track;
let status_bar_item;

/*
This method sets the text of the status bar item

It checks if this has been already set (prevents multiple rewrites of the same values)
If not it rewrites the text ot the status bar item
Changes the current track

    Parameters:
        track (string): value that is need to be set at the status bar
*/

function SetTrack(track) {
    if (track != current_track) {
        status_bar_item.text = track;
        current_track = track;
    }
}

/*
This method gets the track name from VK API

It fetches the status of the user
Returns the track name or the error text

    Parameters:
        token (string): token that is used for getting information from VK API
    Return value:
        Track name / Error name (string): Information that will be shown at the status bar
*/

async function GetMusic(token) {
    const response = await fetch(`https://api.vk.ru/method/status.get?access_token=${token}&v=${ver}`);
    if (!response.ok) {
        return "Network Error";
    }
    const data = await response.json();
    if (data.response != undefined) {
        return "♫ " + data.response.text;
    }
    return "Token Error";
}

/*
This method is starting the loop of getting the track name

It clears the timer if it has already set
Sets interval with function, that gets the music
Calls the SetTrack method

    Parameters:
        token (string): token that is used for getting information from VK API
*/
function StartLoop(token) {
    if (timer_id) clearInterval(timer_id);
    timer_id = setInterval(() => {GetMusic(token)
        .then(result => SetTrack(result))
        .catch(() => SetTrack("Request Error"))}, 1500);
}

/*
This method is getting the token from the user

It shows the input box to enter the token
Starts the loop
Stores the token

    Parameters:
        context (vscode.ExtensionContext): a collection of utilities private to an extension, including secrets
*/
function SetToken(context) {
    vscode.window.showInputBox({
        ignoreFocusOut: true,
        password: true,
        placeHolder: "Enter token"
    }).then(
        input_token => {
            if (input_token != undefined) {
                StartLoop(input_token);
                context.secrets.store("token", input_token);
            } else {
                vscode.window.showInformationMessage("Enter is cancelled");
            }
        });
}

/**
 * @param {vscode.ExtensionContext} context
*/

/*
This method is called then the extension is activated (on the startup of the VS Code)

It creates the status bar item
Gets the token from the secrets
Starts the loop or calling the SetToken function
Adds the command for token setting

    Parameters:
        context (vscode.ExtensionContext): a collection of utilities private to an extension, including secrets and subscriptions
*/
function activate(context) {
    console.log("VkMusicPlugin Activated");

    status_bar_item = vscode.window.createStatusBarItem();
    status_bar_item.show();
    context.secrets.get("token").then(token => {
        if (token != undefined) {
            StartLoop(token);
        } else {
            SetToken(context);
        }
    });

    let disposable = vscode.commands.registerCommand('vkmusicplugin.setToken', () => {
		SetToken(context);
	});

	context.subscriptions.push(disposable);
}

/*
This method is called then the extension is deactivated

It disposes the status bar item
Clears the interval for the loop

*/
function deactivate() {
    status_bar_item.dispose();
    clearInterval(timer_id);
    console.log("VkMusicPlugin Deactivated");
}

module.exports = {
    activate,
    deactivate
}
