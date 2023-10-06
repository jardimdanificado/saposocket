import * as WebSocket from 'ws';

export class Client 
{
    func = {
        log: function(socket,data)
        {
            console.log('server says: ' + data);
        }
    }
    constructor(ipaddr,callback)
    {
        this.socket = new WebSocket.WebSocket('ws://' + (ipaddr) + '/');
        
        this.socket.addEventListener('open', (event) => 
        {
            callback(this.socket,'')
        });
    
        this.socket.addEventListener('message', (event) => 
        {
            if(event.data.id && this.func[event.data.id])
            {
                let data = JSON.parse(event.data)
                this.func[event.data.id](this.socket,data.data);
            }
        });

        this.call = function(id, data)
        {
            this.socket.send(JSON.stringify({
                id: id,
                data: data
            }))
        }
    }
}

export class Server 
{
    func = {
        log: function(socket,request,data)
        {
            console.log(request.connection.remoteAddress + ' says: ' + data);
        }
    }
    constructor(callback)
    {
        const server = new WebSocket.WebSocketServer({ port: 8080 });
        server.on('connection', (socket,request) => 
        {
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
                this.func[data.id](socket,request,data.data);
            });

            socket.on('close', () => 
            {
                console.log('client '+ request.connection.remoteAddress + ' disconnected.');
            });
        });
        console.log('server running on port 8080');
    }
}