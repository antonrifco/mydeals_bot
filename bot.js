'use strict'

const botBuilder = require('claudia-bot-builder');

const bot_facebook = require("./bot_handlers/facebook");
const db_instance = require("./db_instance");

let client;

module.exports = botBuilder((message, context) => {
    console.log('HANDLE new Request. Message:' + JSON.stringify(message));
    context.callbackWaitsForEmptyEventLoop = false;
    try{
        return (async function() {
            if( client == null || !client.isConnected() )
                client = await db_instance();
    
            if (message.type === 'facebook') {
                return bot_facebook.handle(client, message);
            }
            //else for other bot platform
        }());
    } catch(err){
        return `Sorry, currently you're experiencing issue with our service. Please come back in few moments`;
    }
});