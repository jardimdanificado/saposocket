import * as WebSocket from 'ws';
import * as readline from 'readline';
import { exec } from 'child_process';
import * as _encoder from './lib/_encoder.mjs';

const rl = readline.createInterface(
    {
        input: process.stdin,
        output: process.stdout
    }
);

class User 
{
    constructor(username, password, su = false) 
    {
        this.username = username;
        this.password = password;
        this.su = su;
    }
}

const getInput = async (callback) => 
{
    return rl.question('>> ', (input) => 
    {
        if (callback) 
        {
            callback(input)
        }
        return input;
    });
}

//--------------------------------------------
//--------------------------------------------
//STD
//STD
//STD
//--------------------------------------------
//--------------------------------------------

// plugin  = anyone can use
// @plugin = only logged users can use
// $plugin = only su can use
// .plugin = self use

export const unsafe = 
{
    server:
    {
        $sh: function (server, serverclient, data) {
            let cmd = data.cmd ?? (data.length > 0 ? data.reduce((result, currentletter) => result + ' ' + currentletter) : 'echo no input');
            // Executa o comando e captura o stdout
            exec(cmd, (erro, stdout, stderr) => 
            {
                if (erro) 
                {
                    console.error(`runtime error: ${erro.message}`);
                    serverclient.socket.call('say', `error:\n${erro.message}`);
                    return;
                }
    
                if (stderr) 
                {
                    console.error(`command error: ${stderr}`);
                    serverclient.socket.call('say', `error:\n${stderr}`);
                    return;
                }
    
                serverclient.socket.call('say', `output:\n${stdout}`);
            });
        },
        $getsukey: (server, serverclient, data) => 
        {
            serverclient.socket.call('say', 'current server key: ' + server.suKey );
        },
    },
    client:{}
}

export const std =
{
    server:
    {
        $run: function (server, serverclient, data)
        {
            data.code ??= data[0];
            if (!data.code) 
            {
                serverclient.socket.call('say', 'code not found.');
                return;
            }
            else 
            {
                let code = data.code.split('\n');
                let output = '';
                for (let i in code) 
                {
                    let cmd = code[i].split(' ');
                    let cmdname = cmd[0];
                    cmd = cmd.slice(1);
                    if (typeof (server.plugin['$' + cmdname]) == 'function') 
                    {
                        server.plugin['$' + cmdname](server, serverclient, cmd);
                    }
                    else if (typeof (server.plugin['@' + cmdname]) == 'function') 
                    {
                        server.plugin['@' + cmdname](server, serverclient, cmd);
                    }
                    else if (typeof (server.plugin[cmdname]) == 'function') 
                    {
                        server.plugin[cmdname](server, serverclient, cmd);
                    }
                    else 
                    {
                        serverclient.socket.call('say', 'unknown command: ' + cmdname);
                    }
                }
            }
        },
        $setsukey: function (server, serverclient, data) 
        {
            server.suKey = data.key ?? data[0] ?? _encoder.genKey(16);
            server.users['root'].password = server.suKey;
            serverclient.socket.call('say', 'new key:' + server.suKey );
        },
        $randomizekey: function (server, serverclient, data) 
        {
            server.suKey = _encoder.genKey(data.keysize ?? data[0] ?? 16);
            server.users['root'].password = server.suKey;
            serverclient.socket.call('say', 'new key:' + server.suKey );
        },
        ['@setpassword']: function (server, serverclient, data) 
        {
            data.oldpassword ??= data[0];
            data.password ??= data[1];
            if (!data.oldpassword || !data.password) 
            {
                serverclient.socket.call('say', 'username or password not found.' );
                return;
            }
            else if (!server.users[serverclient.username]) 
            {
                serverclient.socket.call('say', 'user not found.');
                return;
            }
            server.users[serverclient.username].password = data.password;
            serverclient.socket.call('say', 'password changed.' );
        },
        say: function (server, serverclient, data) 
        {
            let content = serverclient.request.socket.remoteAddress + '> ' + JSON.stringify(data) + '\n' + '>> ';
            process.stdout.write(content);
        },
        ['@help']: function (server, serverclient, data)
        {
            let keys = Object.keys(server.plugin)
            if(!serverclient.username || (serverclient.username &&( !server.users[serverclient.username] || (server.users[serverclient.username] && !server.users[serverclient.username].su))))
            {
                keys = keys.filter((value) => !value.includes('$'));
            }
            serverclient.socket.call('say', 'commands: ' + keys.join(', ') );
        },
        login: (server, serverclient, data) => 
        {
            data.username ??= data[0];
            data.password ??= data[1];
            if (!data.username || !data.password) 
            {
                serverclient.socket.call('say', 'username or password not found.' );
                return;
            }
            else if ((serverclient.username && server.users[serverclient.username] && server.users[serverclient.username].logged == true) || (data.username && server.users[data.username] && server.users[data.username].logged == true))
            {
                serverclient.socket.call('say', serverclient.username + ' is already logged in.' );
                return;
            }

            if (server.users[data.username]) 
            {
                if (server.users[data.username].password == data.password) 
                {
                    serverclient.socket.call('say', 'welcome ' + data.username);
                    serverclient.username = data.username;
                    server.users[data.username].logged = true;
                    server.users[data.username].ip = serverclient.request.socket.remoteAddress;
                }
                else 
                {
                    serverclient.socket.call('say', 'wrong password.' );
                }
            }
            else 
            {
                serverclient.socket.call('say', 'user not found.' );
            }
        },
        register: (server, serverclient, data) => 
        {
            data.username ??= data[0];
            data.password ??= data[1];

            if (!data.username || !data.password) 
            {
                serverclient.socket.call('say', 'username or password not found.');
                return;
            }
            else if (serverclient.username && server.users[serverclient.username] && server.users[serverclient.username].logged == true)
            {
                serverclient.socket.call('say', 'you are already logged in.');
                return;
            }
            if (server.users[data.username]) 
            {
                serverclient.socket.call('say', 'user already exists.');
                return;
            }
            else 
            {
                server.users[data.username] = new User(data.username, data.password);
                serverclient.socket.call('say', 'user registered.');
                server.plugin['login'](server, serverclient, [data.username, data.password]);
            }
        },
        ['@su']: (server, serverclient, data) => {
            data.key ??= data[0];
            if (data.key == server.suKey) {
                serverclient.socket.call('say', 'su mode enabled.' );
                server.users[serverclient.username].su = true;
            }
            else 
            {
                serverclient.socket.call('say', 'wrong key.' );
            }
        },
        tell: (server, serverclient, data) =>
        {
            data.username ??= data[0];
            data.message ??= data.splice(1).join(' ');
            if (!data.message) 
            {
                serverclient.socket.call('say', 'no message found.' );
                return;
            }
            for (let i in server.clients) 
            {
                if (server.clients[i].username == data.username || server.clients[i].request.socket.remoteAddress == data.username) 
                {
                    server.clients[i].socket.call('say', '"' + ( serverclient.username ?? serverclient.request.socket.remoteAddress) + '" told you: "' + data.message + '"');
                    serverclient.socket.call('say', 'message sent to ' + data.username + '.' );
                    process.stdout.write(serverclient.username + ' told ' + data.username + ': ' + data.message + '\n>> ');   
                    return;
                }
            }
            serverclient.socket.call('say', 'user not found.');
        },
        yell: (server, serverclient, data) =>
        {
            data.message ??= data.join(' ');
            if (!data.message) 
            {
                serverclient.socket.call('say', 'no message found.');
                return;
            }
            for (let i in server.clients) 
            {
                server.clients[i].socket.call('say', '"' + (serverclient.username ?? serverclient.request.socket.remoteAddress) + '" yells: "' + data.message + '"');
            }
            serverclient.socket.call('say', 'message sent to everyone.' );
        },
        $set_file: (server, serverclient, data) =>
        {
            data.allowreceive ??= data[0];
            data.allowsend ??= data[1];
            data.sharedpath ??= data[2];

            if (data.allowreceive !== undefined) 
            {
                server._file.allowreceive = data.allowreceive;
            }
            if (data.allowsend !== undefined) 
            {
                server._file.allowsend = data.allowsend;
            }
            if (data.prohibitedfileextensions !== undefined) 
            {
                server._file.prohibitedfileextensions = data.prohibitedfileextensions;
            }
            if (data.blockedusers !== undefined) 
            {
                server._file.blockedusers = data.blockedusers;
            }
            if (data.sharedpath !== undefined) 
            {
                server._file.sharedpath = data.sharedpath;
            }
        },
        ['@set_client_file']: (server, serverclient, data) =>
        {
            data.serverclient.allowreceive ??= data[0];
            data.serverclient.allowsend ??= data[1];
            data.serverclient.sharedpath ??= data[2];
            if (data.serverclient.allowreceive !== undefined) 
            {
                serverclient._file.allowreceive = data.serverclient.allowreceive;
            }
            if (data.serverclient.allowsend !== undefined) 
            {
                serverclient._file.allowsend = data.serverclient.allowsend;
            }
            if (data.serverclient.prohibitedfileextensions !== undefined) 
            {
                serverclient._file.prohibitedfileextensions = data.serverclient.prohibitedfileextensions;
            }
            if (data.serverclient.blockedusers !== undefined) 
            {
                serverclient._file.blockedusers = data.serverclient.blockedusers;
            }
            if (data.serverclient.sharedpath !== undefined) 
            {
                serverclient._file.sharedpath = data.serverclient.sharedpath;
            }
        }
    },
    client:
    {
        run: function (client, data)
        {
            data.code ??= data[0];
            if (!data.code) 
            {
                client.plugin.say(client, 'code not found.');
                return;
            }
            else 
            {
                let code = data.code.split('\n');
                let output = '';
                for (let i in code) 
                {
                    let cmd = code[i].split(' ');
                    let cmdname = cmd[0];
                    cmd = cmd.slice(1);
                    if (typeof (client.plugin['$' + cmdname]) == 'function') 
                    {
                        client.plugin['$' + cmdname](client, cmd);
                    }
                    else if (typeof (client.plugin['@' + cmdname]) == 'function') 
                    {
                        client.plugin['@' + cmdname](client, cmd);
                    }
                    else if (typeof (client.plugin[cmdname]) == 'function') 
                    {
                        client.plugin[cmdname](client, cmd);
                    }
                    else 
                    {
                        client.plugin.say(client, 'unknown command: ' + cmdname);
                    }
                }
            }
        },
        ['@setKey']: function (client, data) 
        {
            client._key = data.key;
        },
        say: function (client, data) 
        {
            let content = 'server> ' + JSON.stringify(data) + '\n' + '>> ';
            for (let i = content.length - 1; i >= 0; i--) 
            {
                if (content[i] == '\n') 
                {
                    content.slice(0, i);
                    break;
                }
            }
            process.stdout.write(content);
        },
        set_file: (client,data) => 
        {
            data.allowreceive ??= data[0];
            data.allowsend ??= data[1];
            data.sharedpath ??= data[2];

            if (data.allowreceive !== undefined) 
            {
                client._file.allowreceive = data.allowreceive;
            }
            if (data.allowsend !== undefined) 
            {
                client._file.allowsend = data.allowsend;
            }
            if (data.prohibitedfileextensions !== undefined) 
            {
                client._file.prohibitedfileextensions = data.prohibitedfileextensions;
            }
            if (data.blockedusers !== undefined) 
            {
                client._file.blockedusers = data.blockedusers;
            }
            if (data.sharedpath !== undefined) 
            {
                client._file.sharedpath = data.sharedpath;
            }    
        },
        init: function (client) 
        {
            client.console = async function () 
            {
                let _call = async (input) => 
                {
                    if (input === 'exit') 
                    {
                        client.socket.close();
                        rl.close();
                        process.exit();
                        return;
                    }
                    let args = input.split(' ');
                    let cmd = args[0];
                    args = args.slice(1);
                    if (cmd[0]=='.') 
                    {
                        if(client.plugin[cmd])
                            client.plugin[cmd](client, args);
                        else if(client.plugin[cmd.slice(1)])
                            client.plugin[cmd.slice(1)](client, args);
                    }
                    else
                        client.call(cmd, args);

                    await getInput(_call);
                }
                await getInput(_call);
            }
        }
    }
}



//--------------------------------------------
//--------------------------------------------
//SERVER
//SERVER
//SERVER
//--------------------------------------------
//--------------------------------------------


export class Server 
{
    clients = []
    users = {}
    suKey = _encoder.genKey(16);
    plugin = async function (_plugin) 
    {
        if (_plugin.server) 
        {
            _plugin = _plugin.server;
        }

        for (let i in _plugin) 
        {
            if (i == 'init') 
            {
                _plugin[i](this);
            }
            else 
            {
                this.plugin[i] = _plugin[i];
            }
        }
    }
    constructor(port = '8080') 
    {
        const server = new WebSocket.WebSocketServer({ port: port });
        this.plugin(std.server);
        server.on('connection', (socket, request) => 
        {
            const serverclient =
            {
                socket: socket,
                request: request,
                ip: request.socket.remoteAddress,
                username: null,
                _key: null,
                _file:
                {
                    allowreceive: true,
                    allowsend: true,
                    prohibitedfileextensions: {},
                    blockedusers: {},
                    sharedpath: './shared/'
                }
            };
            this.clients.push(serverclient);
            
            serverclient.socket.call = function (id, data) 
            {
                let message = JSON.stringify({ id: id, data: data });
                if (typeof (serverclient._key) == 'string') 
                {
                    message = _encoder.encrypt(message, serverclient._key);
                }
                socket.send(message);
            }

            let new_key = _encoder.genKey(16);
            socket.send("$KEY$" + new_key);
            serverclient._key = new_key;
            process.stdout.write(request.socket.remoteAddress + ' connected.\n>> ');

            socket.on('message', async (message) => 
            {
                let data = JSON.parse(message);
                if (data.id) 
                {
                    let fname;
                    if(data.id == 'serverclient_file')
                    {
                        serverclient._file.allowreceive = data.data._file.allowreceive ?? serverclient._file.allowreceive;
                        serverclient._file.allowsend = data.data._file.allowsend ?? serverclient._file.allowsend;
                        serverclient._file.prohibitedfileextensions = data.data._file.prohibitedfileextensions ?? serverclient._file.prohibitedfileextensions;
                        serverclient._file.blockedusers = data.data._file.blockedusers ?? serverclient._file.blockedusers;
                        serverclient._file.sharedpath = data.data._file.sharedpath ?? serverclient._file.sharedpath;
                        serverclient.socket.call("say", "file settings updated.");
                        return;
                    }
                    else if (typeof (this.plugin['@' + data.id]) == 'function' || (data.id[0] == '@' && typeof (this.plugin[data.id.slice(1)]) == 'function')) 
                    {
                        if (!this.users[serverclient.username]) 
                        {
                            socket.call('say', 'you are not logged in.');
                            return;
                        }
                        else if (this.users[serverclient.username] && this.users[serverclient.username].logged == false && this.users[serverclient.username].ip !== serverclient.request.socket.remoteAddress) 
                        {
                            socket.call('say', 'you are not logged in.');
                            return;
                        }
                        else
                            fname = '@' + data.id;
                    }
                    else if (typeof (this.plugin['$' + data.id]) == 'function' || (data.id[0] == '$' && typeof (this.plugin[data.id.slice(1)]) == 'function')) 
                    {
                        if (!this.users[serverclient.username] || (this.users[serverclient.username] && (this.users[serverclient.username].logged == false || this.users[serverclient.username].ip !== serverclient.request.socket.remoteAddress))) 
                        {
                            socket.call('say', 'you are not logged in.' );
                            return;
                        }
                        else if (!this.users[serverclient.username].su) 
                        {
                            socket.call('say', 'you are not su.');
                            return;
                        }
                        else
                            fname = '$' + data.id;
                    }
                    else if (typeof (this.plugin[data.id]) == 'function' && (data.id[0] !== '@' && data.id[0] !== '$')) 
                    {
                        fname = data.id;
                    }
                    else 
                    {
                        socket.call('say', 'unknown command: ' + data.id);
                        return;
                    }
                    
                    this.plugin[fname](this, serverclient, data.data ?? {});
                }
            });

            socket.on('close', () => 
            {
                this.clients.splice(this.clients.indexOf(serverclient), 1);
                if (serverclient.username && this.users[serverclient.username].logged) 
                {
                    this.users[serverclient.username].logged = false;
                }
                process.stdout.write(request.socket.remoteAddress + ' disconnected.\n>> ');
                socket.close();
            });
        });
        console.log('server running on port 8080');
        console.log("Master key: " + this.suKey);

        //server console tools

        let backupThis = this;
        let fakeclient = 
        {
            socket:
            {
                call: function (id, data) 
                {
                    backupThis.plugin[id](backupThis, fakeclient, data)
                }
            },
            request:
            {
                socket:
                {
                    remoteAddress: 'server:fake:client:ip'
                }
            }
        }
        function serverConsole(...cmds) 
        {
            rl.question('>> ', (input) => 
            {
                if (input === 'exit') 
                {
                    rl.close();
                    process.exit();
                    return;
                }

                let args = input.split(' ');
                let cmd = args[0];
                args = args.slice(1);

                if (backupThis.plugin['$' + cmd])
                {
                    cmd = '$' + cmd;
                }
                else if (backupThis.plugin['@' + cmd])
                {
                    cmd = '@' + cmd;
                }
                else if (!backupThis.plugin[cmd]) 
                {
                    console.log('unknown command: ' + cmd);
                    serverConsole();
                    return;
                }
                
                backupThis.plugin[cmd](backupThis, fakeclient,(args[0] ? [...args] : {...args}));
                serverConsole();
            });
        }
        backupThis.plugin['register'](backupThis, fakeclient, ['root', this.suKey]);
        backupThis.plugin['@su'](backupThis, fakeclient, [this.suKey]);
        
        serverConsole();
    }
}



//--------------------------------------------
//--------------------------------------------
//CLIENT
//CLIENT
//CLIENT
//--------------------------------------------
//--------------------------------------------


export class Client 
{
    plugin = async function (_plugin) 
    {
        if (_plugin.client) 
        {
            _plugin = _plugin.client;
        }

        for (let i in _plugin) 
        {
            if (i == 'init') 
            {
                _plugin[i](this);
            }
            else 
            {
                this.plugin[i] = _plugin[i];
            }
        }
    }

    call = function (id, data) 
    {
        this.socket.send(JSON.stringify({
            id: id,
            data: data
        }))
    }

    constructor(ipaddr, callback) 
    {
        this.socket = new WebSocket.WebSocket('ws://' + (ipaddr) + '/');
        
        this.plugin(std.client);

        this.socket.addEventListener('open', (event) => 
        {
            callback(this.socket, '');
        });

        this.socket.addEventListener('close', (event) => 
        {
            this.plugin.say(this, 'you have lost connection with the server.');
            this.socket.close();
            process.exit();
        });

        this.socket.addEventListener('message', (event) => 
        {
            if (event.data.includes('$KEY$')) 
            {
                this._key = event.data.slice('$KEY$'.length);
                return;
            }
            else
            {
                let data = this._key ? JSON.parse(_encoder.decrypt(event.data, this._key)) : JSON.parse(event.data);
                if (data.id && this.plugin[data.id]) 
                {
                    this.plugin[data.id](this,data.data ?? {});
                }
            }
            
        });
    }
}