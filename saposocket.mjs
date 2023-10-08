import * as WebSocket from 'ws';
import * as readline from 'readline';
import { exec } from 'child_process';

const rl = readline.createInterface(
    {
        input: process.stdin,
        output: process.stdout
    }
);

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
        $: function(server,client,data) 
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
            console.log(client.request.connection.remoteAddress + '> ' + (data.message ?? JSON.stringify(data)));
        },
        user: function(server,client,data)
        {
            client.socket.call('log',{message: 'you are: ' + client.request.connection.remoteAddress});
        },
        login: (server, client, data) =>
        {
            data.key ??= data[0];
            if (server.su.key.indexOf(data.key) == -1)
            {
                client.socket.call('log', { message: 'invalid key.' });
                return;
            }
            else
            {
                server.su.user.push(client.request.connection.remoteAddress);
                client.socket.call('log', { message: 'login successful.' });
            }
        },
        $newkey: (server, client, data) =>
        {
            data.key ??= data[0];
            if (server.su.auth(client.request.connection.remoteAddress))
            {
                server.su.key.push(data.key);
                client.socket.call('log', { message: 'new key added: ' + server.su.key[server.su.key.length - 1] });
            }
            else
            {
                client.socket.call('log', { message: 'unauthorized access denied.' });
                return;
            }
        },
        $randomkey: (server, client, data) =>
        {
            data.keySize ??= parseInt(data[0]);
            if (server.su.auth(client.request.connection.remoteAddress))
            {
                server.su.key.push(genKey(data.keySize));
                client.socket.call('log', { message: 'new key generated: ' + server.su.key[server.su.key.length - 1] });
            }
            else
            {
                client.socket.call('log', { message: 'unauthorized access denied.' });
                return;
            }
        },
        $deletekey : (server, client, data) =>
        {
            data.key ??= data[0];
            if (server.su.auth(client.request.connection.remoteAddress)) 
            {
                server.su.key.splice(server.su.key.indexOf(data.key),1);
                client.socket.call('log',{message:'key deleted.'});
            }
            else
            {
                client.socket.call('log',{message:'unauthorized access denied.'});
                return;
            }
        }
    }
}




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

export class Server 
{
    clients = []
    su = 
    {
        auth:(ip)=>
        {
            if(this.su.user.indexOf(ip) == -1)
            {
                return false;
            }
            else
            {
                return true;
            }
        },
        user:[],
        key:[genKey(64)]
    }
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
            const client = {socket,request};
            this.clients.push(client);
            socket.call = function(id, data)
            {
                socket.send(JSON.stringify({
                    id: id,
                    data: data
                }))
            }
            console.log('client '+ request.connection.remoteAddress + ' connected.');
            
            socket.on('message', async (message) => 
            {
                let data = JSON.parse(message);
                if(data.id)
                {
                    if(typeof(this.plugin[data.id]) == 'function')
                    {
                        if (data.id[0] == '$') 
                        {
                            if (this.su.auth(request.connection.remoteAddress)) 
                            {
                                this.plugin[data.id](this,client,data.data ?? {});
                            }
                            else 
                            {
                                socket.call('log',{message:'unauthorized access denied.'});
                                return;
                            }
                        }
                        this.plugin[data.id](this,client,data.data ?? {});
                    }
                    else
                    {
                        socket.call('log',{message:'unknown command: '+ data.id});
                    }
                }
            });

            socket.on('close', () => 
            {
                this.su.user.splice(this.su.user.indexOf(request.connection.remoteAddress),1);
                this.clients.splice(this.clients.indexOf(client),1);
                console.log('client '+ request.connection.remoteAddress + ' disconnected.');
                socket.close();
            });
        });
        console.log('server running on port 8080');
        console.log("Master key: " + this.su.key[this.su.key.length - 1]);
    }
}