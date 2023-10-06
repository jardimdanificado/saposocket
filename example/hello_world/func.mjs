export var server = 
{
    log: function(socket,request,data)
    {
        console.log(data);
    }
}

export var client = 
{
    log: function(socket,data)
    {
        console.log(data);
    }
}