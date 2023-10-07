import * as WebSocket from 'ws';

import * as readline from 'readline';

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});

const getInput = async (callback) =>
{
    return rl.question('@> ', (input) => 
    {
        if (callback) 
        {
            callback(input)
        }
        return input;
    });
}




export const std = 
{
    client: 
    {
        log:function(client,data)
        {
            let content = 'server says: ' + (data.message ?? JSON.stringify(data)) + '\n' + '@> ';
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
        log: function(server,client,data)
        {
            console.log(client.request.connection.remoteAddress + ' says: ' + (data.message ?? JSON.stringify(data)));
        },
        login:(server,client,data)=>
        {
            data.password ??= data[0];
            if(server.su.password.indexOf(data.password) == -1)
            {
                client.socket.call('log',{message:'invalid password'});
                return;
            }
            else
            {
                server.su.user.push(client.request.connection.remoteAddress);
            }
        },
        $newPassword: (server, client, data) =>
        {
            data.password ??= data[0];
            if (server.su.auth(client.request.connection.remoteAddress)) 
            {
                server.su.password.push(data.password);
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
        user:['127.0.0.1'],
        password:['admin']
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
    }
}