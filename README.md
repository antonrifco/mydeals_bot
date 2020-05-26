## My Deals Bot

Here the bot can help you find deals that match your payment card.

In order to use the bot, you need to register your payment cards first, then the bot can inform you several promotions that are suitable for you.

Currently only works for deals in Indonesia

## Running the Code

1. Firstly you need to clone this project. 
2. Then create a configuration file config.js in the main directory, with following data
```
module.exports = {
    'db_name': '<database>',
    'db_path': "mongodb+srv://<username>:<password>@<db_url>/<database>?retryWrites=true",
    'page_size': 9,
    'small_page_size': 4
};
```
3. Install all required packages
```
npm install

npm install claudia -D
```

4. Upload the code on AWS Lambda, by running
```
npm start 
> Deploy

npm start
> Configure
```

## Authors

* [Anton Rifco](https://github.com/antonrifco)

## License

MIT -- see [LICENSE](LICENSE)
