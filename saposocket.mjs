import * as WebSocket from 'ws';
import * as readline from 'readline';
import { exec } from 'child_process';

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
//GENKEY
//GENKEY
//GENKEY
//--------------------------------------------
//--------------------------------------------

const genKey = function(size) 
{
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%¨&*()_-=[{]}\\|;:\'\"<,>.?/';
    let result = '';
  
    for (let i = 0; i < size; i++) 
    {
        const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
        result += caracteres.charAt(indiceAleatorio);
    }
  
    return result;
}
  
//--------------------------------------------
//--------------------------------------------
//STD
//STD
//STD
//--------------------------------------------
//--------------------------------------------


export const std = 
{
    client: 
    {
        log:function(client,data)
        {
            let content = 'server> ' + (data.message ?? JSON.stringify(data)) + '\n' + '>> ';
            for(let i = content.length - 1; i >= 0; i--)
            {
                if(content[i] == '\n')
                {
                    content.slice(0,i);
                    break;
                }
            }
            process.stdout.write(content);
        },
        init: function(client)
        {
            client.console = async function()
            {
                let _call = async (input)=>
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
                    client.call(cmd,args);
                    await getInput(_call);
                }
                await getInput(_call);
            }
        }
    },
    server: 
    {
        $do: function(server,client,data) 
        {
            let cmd = data.cmd ?? (data.length>0 ? data.reduce((result, currentletter) => result + ' ' + currentletter) : 'echo no input');
            // Executa o comando e captura o stdout
            exec(cmd, (erro, stdout, stderr) => 
            {
                if (erro) 
                {
                    console.error(`runtime error: ${erro.message}`);
                    client.socket.call('log',`error:\n${erro.message}`);
                    return;
                }

                if (stderr) 
                {
                    console.error(`command error: ${stderr}`);
                    client.socket.call('log',`error:\n${stderr}`);
                    return;
                }

                client.socket.call('log',`output:\n${stdout}`);
            });
        },
        
        log: function(server,client,data)
        {
            console.log(client.request.socket.remoteAddress + '> ' + (data.message ?? JSON.stringify(data)));
        },
        ['@register']: (server, client, data) =>
        {
            data.username ??= data[0];
            data.password ??= data[1];
            if(!data.username || !data.password)
            {
                client.socket.call('log',{message:'username or password not found.'});
                return;
            }
            else if(client.username && server.users[client.username] && server.users[client.username].logged == true)
            {
                client.socket.call('log',{message:'you are already logged in.'});
            }

            if(server.users[data.username])
            {
                client.socket.call('log',{message:'user already exists.'});
                return;
            }
            else
            {
                server.users[data.username] = new User(data.username,data.password);
                client.socket.call('log',{message:'user registered.'});
            }
            client.socket.call('log', { message: 'new user added: ' + data.username });
            server.plugin['@login'](server,client,[data.username,data.password]);
        },
        ['@login']: (server, client, data) =>
        {
            data.username ??= data[0];
            data.password ??= data[1];
            if(!data.username || !data.password)
            {
                client.socket.call('log',{message:'username or password not found.'});
                return;
            }
            else if(client.username && server.users[client.username] && server.users[client.username].logged == true)
            {
                client.socket.call('log',{message:'you are already logged in.'});
            }

            if(server.users[data.username])
            {
                if(server.users[data.username].password == data.password)
                {
                    client.socket.call('log',{message:'welcome ' + data.username});
                    client.username = data.username;
                    server.users[data.username].logged = true;
                    server.users[data.username].ip = client.request.socket.remoteAddress;
                }
                else
                {
                    client.socket.call('log',{message:'wrong password.'});
                }
            }
            else
            {
                client.socket.call('log',{message:'user not found.'});
            }
        },
        su: (server, client, data) =>
        {
            data.key ??= data[0];
            if(data.key == server.suKey)
            {
                client.socket.call('log',{message:'su mode enabled.'});
                server.users[client.username].su = true;
            }
            else
            {
                client.socket.call('log',{message:'wrong key.'});
            }
        }
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
    plugin = async function(_plugin)
    {
        if(_plugin.client)
        {
            _plugin = _plugin.client;
        }

        for(let i in _plugin)
        {
            if(i == 'init')
            {
                _plugin[i](this);
            }
            else
            {
                this.plugin[i] = _plugin[i];
            }
        }   
    }

    call = function(id, data)
    {
        this.socket.send(JSON.stringify({
            id: id,
            data: data
        }))
    }

    selfCall = function(id, data)
    {
        this.plugin[id](this,data)
    }
    
    constructor(ipaddr,callback)
    {
        this.socket = new WebSocket.WebSocket('ws://' + (ipaddr) + '/');


        this.socket.addEventListener('open', (event) => 
        {
            callback(this.socket,'');
        });

        this.socket.addEventListener('close', (event) => 
        {
            //rl.close();
            this.selfCall('log',{message:'you have lost connection with the server.'});
            this.socket.close();
            process.exit();
        });

        this.socket.addEventListener('message', (event) => 
        {
            let data = JSON.parse(event.data);
            if(data.id && this.plugin[data.id])
            {
                this.selfCall(data.id,data.data);
            }
        });
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
    suKey = genKey(16);
    plugin = async function(_plugin)
    {
        if(_plugin.server)
        {
            _plugin = _plugin.server;
        }

        for(let i in _plugin)
        {
            if(i == 'init')
            {
                _plugin[i](this);
            }
            else
            {
                this.plugin[i] = _plugin[i];
            }
        }   
    }
    constructor(port='8080')
    {
        const server = new WebSocket.WebSocketServer({ port: port });
            
        server.on('connection', (socket,request) => 
        {
            const client = 
            {
                socket: socket,
                request: request,
                ip: request.socket.remoteAddress,
                username: null
            };
            this.clients.push(client);
            socket.call = function(id, data)
            {
                socket.send(JSON.stringify({
                    id: id,
                    data: data
                }))
            }
            console.log('client '+ request.socket.remoteAddress + ' connected.');
            
            socket.on('message', async (message) => 
            {
                let data = JSON.parse(message);
                if(data.id)
                {
                    let fname;
                    
                    if(typeof(this.plugin[data.id]) == 'function' && data.id[0] != '$' && data.id[0] != '@')
                    {
                        if(!this.users[client.username] && this.users[client.username].logged == false && this.users[client.username].ip !== client.request.socket.remoteAddress)
                        {
                            socket.call('log',{message:'you are not logged in.'});
                            return;
                        }
                        else
                            fname = data.id;
                    }
                    else if(typeof(this.plugin['$' + data.id]) == 'function' || (data.id[0] == '$' && typeof(this.plugin[data.id.slice(1)]) == 'function'))
                    {
                        if(!this.users[client.username] && this.users[client.username].logged == false && this.users[client.username].ip !== client.request.socket.remoteAddress)
                        {
                            socket.call('log',{message:'you are not logged in.'});
                            return;
                        }
                        else if(!this.users[client.username].su)
                        {
                            socket.call('log',{message:'you are not su.'});
                            return;
                        }
                        else
                            fname = '$' + data.id;
                    }
                    else if(typeof(this.plugin['@' + data.id]) == 'function' || (data.id[0] == '@' && typeof(this.plugin[data.id.slice(1)]) == 'function'))
                    {
                        fname = '@' + data.id;
                    }
                    else
                    {
                        socket.call('log',{message:'unknown command: '+ data.id});
                        return;
                    }
                    
                    this.plugin[fname](this,client,data.data ?? {});
                }
            });

            socket.on('close', () => 
            {
                this.clients.splice(this.clients.indexOf(client),1);
                this.users[client.username].logged = false;
                console.log('client '+ request.socket.remoteAddress + ' disconnected.');
                socket.close();
            });
        });
        console.log('server running on port 8080');
        console.log("Master key: " + this.suKey);
        let backupThis = this;
        function serverConsole() 
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
                if(!backupThis.plugin[cmd])
                {
                    console.log('unknown command: ' + cmd);
                    serverInput();
                    return;
                }
                server.plugin[cmd](...args);
                serverConsole();
            });
        }
        serverConsole();
    }
}