export const log = function(server,client,data)
{
    console.log(client.request.connection.remoteAddress + ' says: ' + JSON.stringify(data));
}