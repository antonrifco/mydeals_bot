const config = require('../config');
const fbTemplate = require('claudia-bot-builder').fbTemplate;
const mongo = require("mongodb");

const users = require("../controllers/users");
const cards = require("../controllers/cards");
const promos = require("../controllers/promos");

var facebook = {
    handle : async function(client, message){
        let output = null;
        if(typeof message.postback !== 'undefined' && message.postback) {
            let payload;
            if(typeof message.originalRequest.postback !== 'undefined')
                payload = message.originalRequest.postback.payload;
            else
                payload = message.originalRequest.message.quick_reply.payload;

            if(payload == 'GET_STARTED_PAYLOAD'){
                var user_data = {
                    _id: message.sender,
                    name: null
                }
                output = await users.registerUser(client, user_data);
                if(output){ 
                    var text = new fbTemplate.Text('Welcome to My Deals! Please register your payment cards to get information on eligible deals ' + '❤️❤️❤️');
                    return fullMenu(text);
                } else
                    return error_fb(`Sorry, currently you're experiencing issue with our service. Please come back in few moments`);
            } else if(payload.startsWith('MYCARDS_')){
                var user = message.sender;
                var page = parseInt(payload.substring(8));
                var n_page = page + 1;

                var cards_list = await cards.listMyCards(client, user, page);
                if(typeof cards_list !== mongo.MongoError) {
                    if(page <= 1 && cards_list.length < 1){
                        var text = new fbTemplate.Text(`Ooops. You haven't registered any payment cards.`);
                        return addCardMenu(text);
                    } else {
                        output = new fbTemplate.Generic(); 
                        for(let i in cards_list) {
                            var card = cards_list[i];
                            var b_id = 'DELCARD_' + card._id;
                            var b_card = card.title;
                            var b_type = card.type.capitalize();
                            var b_image = card.image.replace(/\s/g, "%20");
                            
                            output.addBubble(b_card, b_type)
                                    .addImage(b_image)
                                    .addButton('Unregister Card', b_id);
                        }
                        if(cards_list.length < config.page_size)
                            n_page = 1;
                        
                        if(n_page != page)
                            output.addBubble( "More cards here" )
                                .addImage('https://cards.mobejo.com/banks/SEEMORE.png')
                                .addButton('Next', 'MYCARDS_' + n_page );
                        
                        return [
                            "Here are the list of cards you have..",
                            fullMenu(output)
                        ];
                    }
                } else
                    return error_fb('Ooops. Failed retrieving list of cards. Please try again later.. 🙇🙇🙇');
            } else if(payload.startsWith('BANKS_')){ /* Showing List of Banks, with pagination */
                var page = parseInt(payload.substring(6));
                var n_page = page + 1;
                        
                var banks = await cards.listBanks(client, page);
                if(typeof banks !== mongo.MongoError) {
                    output = new fbTemplate.Generic();  
                    for(let i in banks) {
                        var bank = banks[i];
                        var b_id = 'CARDS_' + bank._id + '_' + 1;
                        var b_bank = 'Bank ' + bank.name;
                        var b_image = bank.image.replace(/\s/g, "%20");
                        
                        output.addBubble(b_bank)
                                .addImage(b_image)
                                .addButton('View Cards', b_id);
                    }
                    if(banks.length < config.page_size)
                        n_page = 1;
                    
                    if(n_page != page)
                        output.addBubble( "More banks here" )
                            .addImage('https://cards.mobejo.com/banks/SEEMORE.png')
                            .addButton('Next', 'BANKS_' + n_page );
                    return [
                        "Which Bank/Institution that issue your card?",
                        noMenu(output)
                    ];
                } else
                    return error_fb('Ooops. Failed retrieving list of banks. Please try again later.. 🙇🙇🙇');
            } else if(payload.startsWith('CARDS_')){ /* Showing List of Cards of a Banks, with pagination */
                var id_bank = payload.substring(6, payload.lastIndexOf("_"));
                var page = parseInt( payload.substring(payload.lastIndexOf("_")+1) );
                var n_page = page + 1;
                
                var cards_list = await cards.listCards(client, id_bank, page);
                if(typeof cards_list !== mongo.MongoError) {
                    output = new fbTemplate.Generic();  
                    for(let i in cards_list) {
                        var card = cards_list[i];
                        var b_id = 'ADDCARD_' + card._id;
                        var b_card = card.title;
                        var b_type = card.type.capitalize();
                        var b_image = card.image.replace(/\s/g, "%20");
                        
                        output.addBubble(b_card, b_type)
                                .addImage(b_image)
                                .addButton('Register This', b_id);
                    }
                    if(cards_list.length < config.page_size)
                        n_page = 1;
                    
                    if(n_page != page)
                        output.addBubble( "More cards here" )
                            .addImage('https://cards.mobejo.com/banks/SEEMORE.png')
                            .addButton('Next', 'CARDS_' + id_bank + '_' + n_page );
                    
                    return [
                        "Which card would u like to register?",
                        cardMenu(output)
                    ];
                } else
                    return error_fb('Ooops. Failed retrieving list of Cards. Please try again later.. 🙇🙇🙇');
            } else if(payload.startsWith('ADDCARD_')){ /* Handling Adding Card */
                var id_card = payload.substr(8);
                var user_data = {
                    user: message.sender,
                    card: id_card,
                    created: Date.now(),
                    popularity: 1
                }
                output = await cards.linkCard(client, user_data);
                if(output){ 
                    var text = new fbTemplate.Text('OK, this Card has been registered. You can view complete list of registered Cards at "My Cards" menu');
                    return fullMenu(text);
                } else
                    return error_fb('Ooops. Failed saving Card Info. Please try again later.. 🙇🙇🙇');
            
            } else if(payload.startsWith('DELCARD_')){ /* Handling Deleting Card */
                var user = message.sender;
                var id_card = payload.substr(8);
                
                output = await cards.unlinkCard(client, user, id_card);
                if(output){ 
                    var text = new fbTemplate.Text(`Card has been unregistered`);
                    return fullMenu(text);
                } else
                    return error_fb('Ooops. Failed removing Card Info. Please try again later.. 🙇🙇🙇');
            } else if(payload.startsWith('OPROMO_')){ /* Showing List of Online Promo */
                var user = message.sender;
                var page = parseInt(payload.substring(7));
                var n_page = page + 1;

                var promo_list = await promos.listOnlinePromos(client, user, page);
                if(typeof promo_list !== mongo.MongoError) {
                    if(page <= 1 && promo_list.length < 1){
                        var text = new fbTemplate.Text(`Ooops. There's no deals for you. Try adding more Payment Cards!`);
                        return addCardMenu(text);
                    } else {
                        output = new fbTemplate.Generic(); 
                        for(let i in promo_list) {
                            var promo = promo_list[i];
                            var b_id = 'PROMO_' + promo._id;
                            var b_title = (promo.title) ? promo.title.ellipsize(80) : '';
                            var b_image = promo.image.replace(/\s/g, "%20");
                            var b_merchant = (promo.merchant) ? promo.merchant.ellipsize(60) : '';
                            var b_category = promo.category;
                            var b_expiry = "s.d " + new Date(promo.date_end).toLocaleDateString('en-GB', {day : 'numeric', month : 'short', year : 'numeric'})
                            
                            output.addBubble(b_title, b_merchant + "\n" + b_category + "\n" + b_expiry)
                                    .addImage(b_image);

                            output.addButton('View Details', b_id);
                        }
                        if(promo_list.length < config.page_size)
                            n_page = 1;
                        
                        if(n_page != page)
                            output.addBubble( "More Deals here" )
                                .addImage('https://cards.mobejo.com/banks/SEEMORE.png')
                                .addButton('Next', 'OPROMO_' + n_page );
                        
                        return [
                            "Here are deals for you 🤹",
                            fullMenu(output)
                        ];
                    }
                } else {
                    return error_fb('Ooops. Failed retrieving list of deals. Please try again later.. 🙇🙇🙇');
                }
            } else if(payload.startsWith('CPROMO_')){ /* Showing List of Online Promo per Category */
                var user = message.sender;
                let splittedPayload = payload.split('_');
                var category = splittedPayload[1].trim().capitalize();
                var page = parseInt(splittedPayload[2].trim());
                var n_page = page + 1;

                var promo_list = await promos.listOnlinePromosByCategory(client, user, category, page);
                if(typeof promo_list !== mongo.MongoError) {
                    if(page <= 1 && promo_list.length < 1){
                        var text = new fbTemplate.Text(`Ooops. There's no deals for you in this category. Try adding more Payment Cards!`);
                        return fullMenu(text);
                    } else {
                        output = new fbTemplate.Generic(); 
                        for(let i in promo_list) {
                            var promo = promo_list[i];
                            var b_id = 'PROMO_' + promo._id;
                            var b_title = (promo.title) ? promo.title.ellipsize(80) : '';
                            var b_image = promo.image.replace(/\s/g, "%20");
                            var b_merchant = (promo.merchant) ? promo.merchant.ellipsize(60) : '';
                            var b_category = promo.category;
                            var b_expiry = "s.d " + new Date(promo.date_end).toLocaleDateString('en-GB', {day : 'numeric', month : 'short', year : 'numeric'})
                            
                            output.addBubble(b_title, b_merchant + "\n" + b_category + "\n" + b_expiry)
                                    .addImage(b_image);

                            output.addButton('View Details', b_id);
                        }
                        if(promo_list.length < config.page_size)
                            n_page = 1;
                        
                        if(n_page != page)
                            output.addBubble( "More Deals here" )
                                .addImage('https://cards.mobejo.com/banks/SEEMORE.png')
                                .addButton('Next', 'OPROMO_' + n_page );
                        
                        return [
                            "Here are deals for you 🤹",
                            fullMenu(output)
                        ];
                    }
                } else {
                    return error_fb('Ooops. Failed retrieving list of deals. Please try again later.. 🙇🙇🙇');
                }
            } else if(payload.startsWith('PROMO_')){ /* Showing Details of Promo */
                var id_promo = payload.substring(6);
                
                var promo = await promos.promoDetails(client, id_promo);
                if(typeof promo !== mongo.MongoError) {
                    if(!promo){
                        return error_fb('Ooops. Failed retrieving Deals Info.');
                    } else {
                        let promoImage = new fbTemplate
                                            .Image(promo.image)
                                            .get();

                        var web = 'https://www.mobejo.com';
                        if(typeof promo.website !== 'undefined' && promo.website !== '') {
                            web = promo.website;
                            web += '?utm_source=facebook&utm_campaign=chatbot&utm_medium=hereyourdeals_bot';
                        }
                        
                        var p_attribute = promo.bank.capitalize() + ' with ' + promo.merchant.capitalize();
                        var saying = `"${promo.title.ellipsize(170)}"` + 
                                        "\n" + p_attribute.ellipsize(130) + 
                                        "\n\n" + promo.description.ellipsize(310) + 
                                        "\n\nValid til: " + new Date(promo.date_end).toLocaleDateString('en-GB', {day : 'numeric', month : 'short', year : 'numeric'});
                        output = new fbTemplate.Text(saying).get();

                        let terms = "No Information."
                        if(typeof promo.terms !== 'undefined' && promo.terms !== '')
                            terms = promo.terms.ellipsize(610);
                            
                        let promoTerms = new fbTemplate.Button(`Terms & Conditions:\n\n${terms}`)
                            .addButton("Visit Website", web);
                        return [
                            promoImage,
                            output,
                            fullMenu(promoTerms)
                        ];
                    }
                } else {
                    return error_fb('Ooops. Failed retrieving Deals Info. Please try again later.. 🙇🙇🙇');
                }
            }
        } else {
            var text = new fbTemplate.Text(`Hello, friend! Anything I can help?`);
            return fullMenu(text);
        }
    },
}

let noMenu = function (template) {
    return template.get();
}

let addCardMenu = function (template) {
    return template
            .addQuickReply('Add Card', 'BANKS_1')
            .get();
}

let cardMenu = function (template) {
    return template
            .addQuickReply('My Cards', 'MYCARDS_1')
            .addQuickReply('See List of Card Issuer', 'BANKS_1')
            .get();
}

let fullMenu = function (template) {
    return template
            .addQuickReply('My Cards', 'MYCARDS_1')
            .addQuickReply('Add Card', 'BANKS_1')
            .addQuickReply('Get Promo', 'OPROMO_1')
            .get();
}

let shortMenu = function (template) {
    return template
            .addQuickReply('Get Promo', 'OPROMO_1')
            .get();
}

let error_fb = function(str){
    var newMessage = new fbTemplate.Text(str);

    return fullMenu(newMessage);
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.ellipsize = function(length) {
    if(this.length <= length) return this;
    else return this.substr(0, length-2) + '..';
}

module.exports = facebook;