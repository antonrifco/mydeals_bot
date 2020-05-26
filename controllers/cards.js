const config = require('../config');

var cards = {
    listBanks : async function(client, page){
        try {
            var db = await client.db(config.db_name);
            //var count = await db.collection('banks').countDocuments();
            var page_limit = config.page_size;
            var skip = page_limit * (page - 1);
            var result = await db.collection('banks').find().sort({popularity: -1}).skip(skip).limit(page_limit);
            return result.toArray();
        } catch (err) {
            return err;
        } finally {
            //await client.close();
        }
        
    },

    listCards : async function(client, bank, page){
        try {
            var db = await client.db(config.db_name);
            //var count = await db.collection('cards').countDocuments({provider: bank});
            var page_limit = config.page_size;
            var skip = page_limit * (page - 1);
            var result = await db.collection('cards').find({provider: bank}).sort({popularity: -1}).skip(skip).limit(page_limit);
            return result.toArray();
        } catch (err) {
            return err;
        } finally {
            //await client.close();
        }
    },

    listMyCards : async function(client, user, page){
        try {
            var db = await client.db(config.db_name);
            
            var page_limit = config.page_size;
            var skip = page_limit * (page - 1);
            var result = await db.collection('user_card_mappings').aggregate([
                { "$lookup": {from: "cards","localField":"card", "foreignField":"_id", "as":"card"}},
                { "$unwind": "$card" },
                { "$project": { "_id": "$card._id", "user": 1, "popularity": 1, "type": "$card.type", 
                                "provider": "$card.provider", "network": "$card.network", "title": "$card.title", 
                                "image": "$card.image", "image_hires": "$card.image_hires", "card_enabled": "$card.enabled"}},
                { "$match" : { 
                    "user" : user, 
                    "card_enabled": true} 
                },
                { "$sort" : { "popularity" : -1 } },
                { "$skip" : skip },
                { "$limit" : page_limit }
            ])
            
            return result.toArray();
        } catch (err) {
            return err;
        } finally {
            //await client.close();
        }
    },

    linkCard : async function(client, data){
        try {
            var user_data = data;
            var db = await client.db(config.db_name);
            
            var result = await db.collection('user_card_mappings').updateOne( 
                { 'user': data.user, card: data.card }, 
                { $set: user_data }, 
                { 'upsert': true }
            );
            return true;
        } catch (err) {
            return err;
        } finally {
            //await client.close();
        }
    },

    unlinkCard : async function(client, user, card_id){
        try {
            var db = await client.db(config.db_name);
            
            var result = await db.collection('user_card_mappings').deleteOne( 
                { user: user, card: card_id }, 
                true
            );
            return true;
        } catch (err) {
            return err;
        } finally {
            //await client.close();
        }
    }
    
}
    

module.exports = cards;