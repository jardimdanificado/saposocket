import * as fs from 'fs';

export const server = 
{
    fwrite: function(server,client,data)
    {
        data.destiny ??= data[0];
        fs.writeFileSync('./shared/' + data.filename, data.buffer);
        client.socket.call('log', { message: 'file written: ' + data.destiny });
    },
    init: function(server,client,data)
    {
        server._file = 
        {
            allowReceive: true,
            allowSend: true,
            prohibitedFileExtensions: {},
            blockedUsers: {},
            
        }
    }
}

export const client = 
{
    freceive: function(client,data)
    {
        if (client._file.allowReceive == false) 
        {
            return;
        }
        fs.writeFileSync('./shared/' + data.filename, data.buffer);
        client.socket.call('log', { message: 'file written: ' + data.destiny });
    },
    fsend: function(client,data)
    {
        if (client._file.allowSend == false) 
        {
            return;
        }
        data.filename ??= data[0];
        console.log(data)
        let buffer = fs.readFileSync('./shared/' + data.filename);
        client.socket.call('freceive', {filename: data.filename, buffer: buffer });
    },
    init: function(server,client,data)
    {
        server._file = 
        {
            allowReceive: true,
            allowSend: true,
            prohibitedFileExtensions: {},
            blockedUsers: {},
        }
    }
}

