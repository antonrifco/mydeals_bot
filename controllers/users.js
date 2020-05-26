const config = require('../config');

var users = {
    registerUser : async function(client, data){
        try {
            var user_data = {
                name: data.name,
                last_loc: null,
                created: Date.now(),
                enabled: true
            };
            var db = await client.db(config.db_name);
            
            var result = await db.collection('users').updateOne( {'_id': data._id}, {$set: user_data}, {'upsert': true});
            return true;
        } catch (err) {
            return err;
        } finally {
            //await client.close();
        }
    },
    
    getUser : async function(client, user_id){
        try {
            var db = await client.db(config.db_name);
            var result = await db.collection('users').findOne({_id: user_id});
            return result;
            
        } catch (err) {
            return err;
        } finally {
            //await client.close();
        }
    },
}
    

module.exports = users;