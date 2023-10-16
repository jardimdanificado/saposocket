import * as fs from 'fs';

export const server = 
{
    $runfile: function(server,serverclient,data)
    {
        let filename = data.filename ??= data[0];
        if (!filename) 
        {
            serverclient.socket.call('say', 'filename not found.');
            return;
        }
        if (!fs.existsSync(serverclient._file.sharedpath + filename)) 
        {
            serverclient.socket.call('say', 'file not found.');
            return;
        }
        let buffer = fs.readFileSync(serverclient._file.sharedpath + filename);
        serverclient.socket.call('$run', {code: buffer.toString()});
    },
    newtxt: (server, serverclient, data) =>
    {
        data.filename ??= data[0];
        data.content ??= data.splice(1).join(' ');
        if (!data.filename || !data.content) 
        {
            serverclient.socket.call('say', 'filename or content not found.');
            return;
        }
        if (fs.existsSync(serverclient.datapath + data.filename)) 
        {
            serverclient.socket.call('say', 'file already exists.');
            return;
        }
        fs.writeFileSync(serverclient._file.sharedpath + data.filename, data.content);
        serverclient.socket.call('say', 'file created.');
    },
    newfolder: (server, serverclient, data) =>
    {
        data.foldername ??= data[0];
        if (!data.foldername) 
        {
            serverclient.socket.call('say', 'foldername not found.');
            return;
        }
        if (fs.existsSync(serverclient._file.sharedpath + data.foldername)) 
        {
            serverclient.socket.call('say', 'folder already exists.');
            return;
        }
        fs.mkdirSync(serverclient._file.sharedpath + data.foldername);
        serverclient.socket.call('say', 'folder created.');
    },
    delfile: (server, serverclient, data) =>
    {
        data.filename ??= data[0];
        if (!data.filename) 
        {
            serverclient.socket.call('say', 'filename not found.');
            return;
        }
        if (!fs.existsSync(serverclient._file.sharedpath + data.filename)) 
        {
            serverclient.socket.call('say', 'file not found.');
            return;
        }
        fs.unlinkSync(serverclient._file.sharedpath + data.filename);
        serverclient.socket.call('say', 'file deleted.');
    },
    delfolder: (server, serverclient, data) =>
    {
        data.foldername ??= data[0];
        if (!data.foldername) 
        {
            serverclient.socket.call('say', 'foldername not found.');
            return;
        }
        if (!fs.existsSync(serverclient._file.sharedpath + data.foldername)) 
        {
            serverclient.socket.call('say', 'folder not found.');
            return;
        }
        fs.rmdirSync(serverclient._file.sharedpath + data.foldername);
        serverclient.socket.call('say', 'folder deleted.');
    },
    filereceive: function(server,serverclient,data)
    {
        if (server._file.allowreceive == false) 
        {
            serverclient.socket.call('say', 'file receive is not allowed.');
            return;
        }
        fs.writeFileSync(server._file.sharedpath + data.filename, Buffer.from(data.buffer));
        serverclient.socket.call('say', 'file written: ' + data.filename);
    },
    filesend: function(server,serverclient,data)
    {
        data.filename ??= data[0];
        if (serverclient._file.allowsend == false) 
        {
            serverclient.socket.call('say', 'file send is not allowed.');
            return;
        }
        else if (!fs.existsSync(serverclient._file.sharedpath + data.filename)) 
        {
            serverclient.socket.call('say', 'file not found.');
            return;
        }
        data.filename ??= data[0];
        let buffer = fs.readFileSync(serverclient._file.sharedpath + data.filename);
        
        serverclient.socket.call('filereceive', {filename: data.filename, buffer: buffer });
    },
    fetch: function(server,serverclient,data)
    {
        if (server._file.allowreceive == false) 
        {
            serverclient.socket.call('say', 'file receive is not allowed.');
            return;
        }
        data.filename ??= data[0];
        serverclient.socket.call('filesend', {filename: data.filename});
    },
    fetchfrom: function(server,_serverclient,data)
    {
        if (server._file.allowreceive == false) 
        {
            _serverclient.socket.call('say', 'file receive is not allowed.');
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
        if (server._file.allowreceive == false) 
        {
            serverclient.socket.call('say', 'file receive is not allowed.');
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
            allowreceive: true,
            allowsend: true,
            prohibitedfileextensions: {},
            blockedusers: {},
            sharedpath: './shared/'
        }
    }
}

export const client = 
{
    newtxt: (client, data) =>
    {
        data.filename ??= data[0];
        data.content ??= data.splice(1).join(' ');
        if (!data.filename || !data.content) 
        {
            client.plugin.call('say', 'filename or content not found.');
            return;
        }
        if (fs.existsSync(client._file.sharedpath + data.filename)) 
        {
            client.socket.call('say', 'file already exists.');
            return;
        }
        fs.writeFileSync(client._file.sharedpath + data.filename, data.content);
        client.call('say', 'file created.');
    },
    newfolder: (client, data) =>
    {
        data.foldername ??= data[0];
        if (!data.foldername) 
        {
            client.call('say', 'foldername not found.');
            return;
        }
        if (fs.existsSync(client._file.sharedpath + data.foldername)) 
        {
            client.call('say', 'folder already exists.');
            return;
        }
        fs.mkdirSync(client._file.sharedpath + data.foldername);
        client.call('say', 'folder created.');
    },
    delfile: (client, data) =>
    {
        data.filename ??= data[0];
        if (!data.filename) 
        {
            client.call('say', 'filename not found.');
            return;
        }
        if (!fs.existsSync(client._file.sharedpath + data.filename)) 
        {
            client.call('say', 'file not found.');
            return;
        }
        fs.unlinkSync(client._file.sharedpath + data.filename);
        client.call('say', 'file deleted.');
    },
    delfolder: (client, data) =>
    {
        data.foldername ??= data[0];
        if (!data.foldername) 
        {
            client.call('say', 'foldername not found.');
            return;
        }
        if (!fs.existsSync(client._file.sharedpath + data.foldername)) 
        {
            client.call('say', 'folder not found.');
            return;
        }
        fs.rmdirSync(client._file.sharedpath + data.foldername);
        client.call('say', 'folder deleted.');
    },
    filereceive: function(client,data)
    {
        if (client._file.allowreceive == false) 
        {
            process.stdout.write('file receive is not allowed.');
            return;
        }
        fs.writeFileSync(client._file.sharedpath + data.filename, Buffer.from(data.buffer));
        client.call('say', 'file written: ' + data.filename);
    },
    filesend: function(client,data)
    {
        if (client._file.allowsend == false) 
        {
            process.stdout.write('file send is not allowed.');
            return;
        }
        else if (!fs.existsSync(client._file.sharedpath + data.filename))
        {
            process.stdout.write('file not found.');
            return;
        }
        data.filename ??= data[0];
        let buffer = fs.readFileSync(client._file.sharedpath + data.filename);
        client.call('filereceive', {filename: data.filename, buffer: buffer});
    },
    fetchback: function(client,data)
    {
        if (client._file.allowsend == false) 
        {
            process.stdout.write('file send is not allowed.');
            return;
        }
        let buffer = fs.readFileSync(client._file.sharedpath + data.filename);
        client.call('fetchrepass', {filename: data.filename, buffer: buffer, to: data.to, from: data.from});
    },
    fetch: function(client,data)
    {
        if (client._file.allowreceive == false) 
        {
            process.stdout.write('file receive is not allowed.');
            return;
        }
        data.filename ??= data[0];
        client.call('filesend', {filename: data.filename});
    },
    ['.filecfg']: function(client,data)
    {
        data[0] ??= data.cfg;
        data[0] = data[0].toLowerCase();
        client._file['allow' + data[0]] = client._file['allow' + data[0]] ? false : true;
        client.call('serverclient_file',{_file: client._file})
        client.call('say', 'file ' + data[0] + ' ' + (client._file['allow' + data[0]] ? 'allowed' : 'blocked') + '.');
    },
    runfile: function(client,data)
    {
        let filename = data.filename ??= data[0];
        if (!filename) 
        {
            client.call('say', 'filename not found.');
            return;
        }
        if (!fs.existsSync(client._file.sharedpath + filename)) 
        {
            client.call('say', 'file not found.');
            return;
        }
        let buffer = fs.readFileSync(client._file.sharedpath + filename);
        client.plugin.run(client,{code: buffer.toString()});
    },
    init: function(client,data)
    {
        client._file = 
        {
            allowreceive: true,
            allowsend: true,
            prohibitedfileextensions: {},
            blockedusers: {},
            sharedpath: './shared/'
        }
    }
}

