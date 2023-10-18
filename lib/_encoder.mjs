export const __ascii = ` !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿĀāĂăĄąĆćĈĉĊċČčĎďĐđĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħĨĩĪīĬĭĮįİıĲĳĴĵĶķĸĹĺĻļĽľĿŀŁłŃńŅņŇňŉŊŋŌōŎŏŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽž`;

//--------------------------------------------
//--------------------------------------------
//GENKEY
//GENKEY
//GENKEY
//--------------------------------------------
//--------------------------------------------

export const genKey = function (size) 
{
    const caracteres = __ascii;
    let result = '';

    for (let i = 0; i < size; i++) 
    {
        const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
        result += caracteres.charAt(indiceAleatorio);
    }

    return result;
}


//--------------------------------------------
//--------------------------------------------
//CRYPTO
//CRYPTO
//CRYPTO
//--------------------------------------------
//--------------------------------------------

// Função para criptografar uma mensagem usando a chave
export function encrypt(message, key) 
{
    if (typeof key === 'string') 
    {
        key = key.split('').map(char => char.charCodeAt(0));
    }

    const messageBuffer = new TextEncoder().encode(message);
    const encryptedBuffer = new Uint8Array(messageBuffer.length);

    for (let i = 0; i < messageBuffer.length; i++) 
    {
        const charValue = messageBuffer[i];
        const keyCharValue = key[i % key.length];
        const encryptedValue = charValue + keyCharValue;
        encryptedBuffer[i] = encryptedValue;
    }

    return encryptedBuffer;
}

export function decrypt(encryptedMessage, key) 
{
    if (typeof key === 'string') 
    {
        key = key.split('').map(char => char.charCodeAt(0));
    }

    const decryptedBuffer = new Uint8Array(encryptedMessage.length);

    for (let i = 0; i < encryptedMessage.length; i++) 
    {
        const charValue = encryptedMessage[i];
        const keyCharValue = key[i % key.length];
        const decryptedValue = charValue - keyCharValue;
        decryptedBuffer[i] = decryptedValue;
    }

    const decryptedMessage = new TextDecoder().decode(decryptedBuffer);
    return decryptedMessage;
}
