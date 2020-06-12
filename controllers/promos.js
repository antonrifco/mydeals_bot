const config = require('../config');

var promos = {
    listOnlinePromos : async function(client, user, page){
        if(page < 1) page = 1;
        try {
            var db = await client.db(config.db_name);
            
            var page_limit = config.page_size;
            var skip = page_limit * (page - 1);
            var result = await db.collection('user_card_mappings').aggregate([
                { "$lookup": {from: "cards","localField":"card", "foreignField":"_id", "as":"card"}},
                { "$unwind": "$card" },
                { "$lookup":{"from":"promotions", "localField":"card.provider", "foreignField":"bank", "as":"promotion"} },
                { "$unwind": "$promotion" },
                { "$project": { 
                    "promotion": 1, "user": 1, "card": 1,
                    "sameBank": {"$eq": ["$card.provider", "$promotion.bank"]}, 
                    "sameProvider": {"$in": ["$card.network", "$promotion.network"]}, 
                    "sameCard": {"$in": ["$card._id", "$promotion.card"]},
                    "sameCardType": {"$in": ["$card.type", "$promotion.card_type"]}
                }},
                { "$match" : { 
                    "user" : user, 
                    "card.enabled": true, 
                    "$and": [
                        {"sameBank": true}, 
                        {"$or": [ {"promotion.network": []}, {"sameProvider": true} ]},
                        {"$or": [ {"promotion.card": []}, {"sameCard": true} ]}, 
                        {"$or": [ {"promotion.card_type": []}, {"sameCardType": true} ]}, 
                    ], 
                    "promotion.is_online": true, "promotion.enabled" :true, 
                    "promotion.date_start": {"$lte": (new Date().setDate(new Date().getDate()+1))}, 
                    "promotion.date_end": {"$gte": (new Date().setHours(0,0,0,0))} 
                }},
                { "$group" : { 
                    "_id": "$promotion._id",
                    "user" : { $first: "$user" }, "matched_cards": { $push: "$card._id" }, 
                    "merchant": {$first: "$promotion.merchant"}, "category": {$first: "$promotion.category"},
                    "title": {$first: "$promotion.title"}, "description": {$first: "$promotion.description"}, "terms": {$first: "$promotion.terms"}, "website": {$first: "$promotion.website"},
                    "image": {$first: "$promotion.image"}, "bank": {$first: "$promotion.bank"}, "network": {$first: "$promotion.network"}, "card": {$first: "$promotion.card"},
                    "is_online": {$first: "$promotion.is_online"}, "popularity": {$first: "$promotion.popularity"},
                    "date_start": {$first: "$promotion.date_start"}, "date_end": {$first: "$promotion.date_end"}
                }},
                { "$sort" : { "popularity" : -1 } },
                { "$skip" : skip },
                { "$limit" : page_limit }
            ]);
            
            return result.toArray();
        } catch (err) {
            return err;
        } finally {
            //await client.close();
        }
    },

    listOnlinePromosByCategory : async function(client, user, category, page){
        if(page < 1) page = 1;
        try {
            var db = await client.db(config.db_name);
            
            var page_limit = config.page_size;
            var skip = page_limit * (page - 1);
            var result = await db.collection('user_card_mappings').aggregate([
                { "$lookup": {from: "cards","localField":"card", "foreignField":"_id", "as":"card"}},
                { "$unwind": "$card" },
                { "$lookup":{"from":"promotions", "localField":"card.provider", "foreignField":"bank", "as":"promotion"} },
                { "$unwind": "$promotion" },
                { "$project": { 
                    "promotion": 1, "user": 1, "card": 1,
                    "sameBank": {"$eq": ["$card.provider", "$promotion.bank"]}, 
                    "sameProvider": {"$in": ["$card.network", "$promotion.network"]}, 
                    "sameCard": {"$in": ["$card._id", "$promotion.card"]},
                    "sameCardType": {"$in": ["$card.type", "$promotion.card_type"]}
                }},
                { "$match" : { 
                    "user" : user, 
                    "card.enabled": true, 
                    "$and": [
                        {"sameBank": true}, 
                        {"$or": [ {"promotion.network": []}, {"sameProvider": true} ]},
                        {"$or": [ {"promotion.card": []}, {"sameCard": true} ]}, 
                        {"$or": [ {"promotion.card_type": []}, {"sameCardType": true} ]}, 
                    ], 
                    "promotion.is_online": true, "promotion.enabled" :true, "promotion.category": category,
                    "promotion.date_start": {"$lte": (new Date().setDate(new Date().getDate()+1))}, 
                    "promotion.date_end": {"$gte": (new Date().setHours(0,0,0,0))} 
                }},
                { "$group" : { 
                    "_id": "$promotion._id",
                    "user" : { $first: "$user" }, "matched_cards": { $push: "$card._id" }, 
                    "merchant": {$first: "$promotion.merchant"}, "category": {$first: "$promotion.category"},
                    "title": {$first: "$promotion.title"}, "description": {$first: "$promotion.description"}, "terms": {$first: "$promotion.terms"}, "website": {$first: "$promotion.website"},
                    "image": {$first: "$promotion.image"}, "bank": {$first: "$promotion.bank"}, "network": {$first: "$promotion.network"}, "card": {$first: "$promotion.card"},
                    "is_online": {$first: "$promotion.is_online"}, "popularity": {$first: "$promotion.popularity"},
                    "date_start": {$first: "$promotion.date_start"}, "date_end": {$first: "$promotion.date_end"}
                }},
                { "$sort" : { "popularity" : -1 } },
                { "$skip" : skip },
                { "$limit" : page_limit }
            ]);
            
            return result.toArray();
        } catch (err) {
            return err;
        } finally {
            //await client.close();
        }
    },

    promoDetails : async function(client, promo_id){
        try {
            var db = await client.db(config.db_name);
            var result = await db.collection('promotions').findOne({_id: new require("mongodb").ObjectId(promo_id)});
            return result;
            
        } catch (err) {
            return err;
        } finally {
            //await client.close();
        }
    },
}

module.exports = promos;