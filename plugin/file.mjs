import * as fs from 'fs';

export const server = 
{
    newfile: (server, serverclient, data) =>
    {
        data.filename ??= data[0];
        data.content ??= data.splice(1).join(' ');
        if (!data.filename || !data.content) 
        {
            serverclient.socket.call('log', 'filename or content not found.');
            return;
        }
        if (fs.existsSync(serverclient.datapath + data.filename)) 
        {
            serverclient.socket.call('log', 'file already exists.');
            return;
        }
        fs.writeFileSync(serverclient._file.sharedpath + data.filename, data.content);
        serverclient.socket.call('log', 'file created.');
    },
    filereceive: function(server,serverclient,data)
    {
        if (server._file.allowReceive == false) 
        {
            return;
        }
        fs.writeFileSync(server._file.sharedpath + data.filename, Buffer.from(data.buffer));
        serverclient.socket.call('log', 'file written: ' + data.filename);
    },
    filesend: function(server,serverclient,data)
    {
        data.filename ??= data[0];
        if (serverclient._file.allowSend == false) 
        {
            return;
        }
        data.filename ??= data[0];
        let buffer = fs.readFileSync(serverclient._file.sharedpath + data.filename);
        
        serverclient.socket.call('filereceive', {filename: data.filename, buffer: buffer });
    },
    fetch: function(server,serverclient,data)
    {
        if (server._file.allowReceive == false) 
        {
            return;
        }
        data.filename ??= data[0];
        serverclient.socket.call('filesend', {filename: data.filename});
    },
    fetchfrom: function(server,_serverclient,data)
    {
        if (server._file.allowReceive == false) 
        {
            return;
        }
        data.from = _serverclient.username;
        data.to ??= data[0];
        data.filename ??= data[1];
        for (let serverclient of server.clients) 
        {
            if (serverclient.username == data.to) 
            {
                serverclient.socket.call('fetchback', {filename: data.filename, to: data.to, from: data.from});
                return;
            }
            
        }
    },
    fetchrepass: function(server,serverclient,data)
    {
        if (server._file.allowReceive == false) 
        {
            return;
        }
        for (let serverclient of server.clients) 
        {
            if (serverclient.username == data.from) 
            {
                serverclient.socket.call('filereceive', {filename: data.filename, buffer: data.buffer});
                return;
            }
        }
    },
    init: function(server,serverclient,data)
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
    filereceive: function(client,data)
    {
        if (client._file.allowReceive == false) 
        {
            return;
        }
        console.log(data,client._file.sharedpath + data.filename)
        fs.writeFileSync(client._file.sharedpath + data.filename, Buffer.from(data.buffer));
        client.call('log', 'file written: ' + data.filename);
    },
    filesend: function(client,data)
    {
        if (client._file.allowSend == false) 
        {
            return;
        }
        data.filename ??= data[0];
        let buffer = fs.readFileSync(client._file.sharedpath + data.filename);
        client.call('filereceive', {filename: data.filename, buffer: buffer});
    },
    fetchback: function(client,data)
    {
        if (client._file.allowSend == false) 
        {
            return;
        }
        let buffer = fs.readFileSync(client._file.sharedpath + data.filename);
        client.call('fetchrepass', {filename: data.filename, buffer: buffer, to: data.to, from: data.from});
    },
    fetch: function(client,data)
    {
        if (client._file.allowReceive == false) 
        {
            return;
        }
        data.filename ??= data[0];
        client.call('filesend', {filename: data.filename});
    },
    init: function(client,data)
    {
        client._file = 
        {
            allowReceive: true,
            allowSend: true,
            prohibitedFileExtensions: {},
            blockedUsers: {},
            sharedpath: './shared/'
        }
    }
}

