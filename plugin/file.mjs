import * as fs from 'fs';

export const server = 
{
    fwrite: function(server,client,data)
    {
        data.destiny ??= data[0];
        fs.writeFileSync('./shared/' + data.destiny, data.buffer);
        client.socket.call('log', { message: 'file written in server: ' + data.destiny });
    },
    
}

export const client = 
{
    fsend: function(client,data)
    {
        data.origin ??= data[0];
        data.destiny ??= data[1];
        console.log(data)
        let buffer = fs.readFileSync(data.origin);
        client.socket.call('fwrite', {destiny: data.destiny, buffer: buffer });
    }
}

