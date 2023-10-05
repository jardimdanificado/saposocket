import * as WebSocket from "ws";
import {execa} from 'execa';

const server = new WebSocket.WebSocketServer({ port: 8080 });
server.on('connection', (socket,request) => 
{
    socket.on('message', async (message) => 
    {
        let cmd = message.split(' ');
        let CMD = cmd[0];
        cmd.splice(0,1)
        let result = await execa(CMD, cmd);
        socket.send(result);
    });

    socket.on('close', () => 
    {
        console.log('Cliente desconectado.');
    });
});

console.log('Servidor WebSocket está ouvindo na porta 8080');
