import * as fs from 'fs';

export const server = 
{
    newfile: (server, client, data) =>
    {
        data.filename ??= data[0];
        data.content ??= data.splice(1).join(' ');
        if (!data.filename || !data.content) 
        {
            client.socket.call('log', 'filename or content not found.');
            return;
        }
        if (fs.existsSync(client.datapath + data.filename)) 
        {
            client.socket.call('log', 'file already exists.');
            return;
        }
        fs.writeFileSync(client._file.sharedpath + data.filename, data.content);
        client.socket.call('log', 'file created.');
    },
    freceive: function(server,client,data)
    {
        if (server._file.allowReceive == false) 
        {
            return;
        }
        fs.writeFileSync(server._file.sharedpath + data.filename, data.buffer);
        client.socket.call('log', 'file written: ' + data.destiny);
    },
    fsend: function(server,client,data)
    {
        data.filename ??= data[0];
        if (client._file.allowSend == false) 
        {
            return;
        }
        data.filename ??= data[0];
        let buffer = fs.readFileSync(client._file.sharedpath + data.filename);
        
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
            sharedpath: './shared/'
        }
    }
}

export const client = 
{
    newfile: (client, data) =>
    {
        data.filename ??= data[0];
        data.content ??= data.splice(1).join(' ');
        if (!data.filename || !data.content) 
        {
            client.plugin.call('log', 'filename or content not found.');
            return;
        }
        if (fs.existsSync(client._file.sharedpath + data.filename)) 
        {
            client.socket.call('log', 'file already exists.');
            return;
        }
        fs.writeFileSync(client._file.sharedpath + data.filename, data.content);
        client.call('log', 'file created.');
    },
    freceive: function(client,data)
    {
        if (client._file.allowReceive == false) 
        {
            return;
        }
        fs.writeFileSync(client._file.sharedpath + data.filename, Buffer.from(data.buffer));
        client.call('log', 'file written: ' + data.filename);
    },
    fsend: function(client,data)
    {
        if (client._file.allowSend == false) 
        {
            return;
        }
        data.filename ??= data[0];
        let buffer = fs.readFileSync(client._file.sharedpath + data.filename);
        client.call('freceive', {filename: data.filename, buffer: buffer});
    },
    ['.fetch']: function(client,data)
    {
        if (client._file.allowReceive == false) 
        {
            return;
        }
        data.filename ??= data[0];
        client.call('fsend', {filename: data.filename});
        
    },
    init: function(client,data)
    {
    }
}

