import * as WebSocket from 'ws';



export class Client 
{
    func = {};
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
                this.func[i] = _plugin[i];
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
        this.func[id](this,data)
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
            if(data.id && this.func[data.id])
            {
                this.selfCall(data.id,data.data);
            }
        });
    }
}

export class Server 
{
    func = 
    {
        login:(server,client,data)=>
        {
            data.password ??= data[0];
            if(this.su.password.indexOf(data.password) == -1)
            {
                client.socket.call('log',{message:'invalid password'});
                return;
            }
            else
            {
                this.su.user.push(client.request.connection.remoteAddress);
            }
        },
        $newPassword: (server, client, data) =>
        {
            data.password ??= data[0];
            if (this.su.auth(client.request.connection.remoteAddress)) 
            {
                this.su.password.push(data.password);
            }
            else
            {
                client.socket.call('log',{message:'unauthorized access denied.'});
                return;
            }
        }
    }
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
                this.func[i] = _plugin[i];
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
                    if(typeof(this.func[data.id]) == 'function')
                    {
                        if (data.id[0] == '$') 
                        {
                            if (this.su.auth(request.connection.remoteAddress)) 
                            {
                                this.func[data.id](this,client,data.data ?? {});
                            }
                            else 
                            {
                                socket.call('log',{message:'unauthorized access denied.'});
                                return;
                            }
                        }
                        this.func[data.id](this,client,data.data ?? {});
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