#! /usr/bin/env node

var program = require('commander'),
    DigitalOcean = require('do-wrapper'),
    util = require('util');
program
    .version(process.env.npm_package_version)
    .option('--api-key [api-key]', 'Digital Ocean Secret key')
    .option('--region [api-key]', 'region [fra1, nyc1-3]')
    .option('--public-key [public-key]', 'SSH Public Key')
    .option('--public-key-file [public-key-file]', 'Path to SSH Public Key File')
    .parse(process.argv);

if (!program.apiKey)
    throw new Error('--api-key required')

if (!program.region)
    throw new Error('--region required')

if (!program.publicKey && !program.publicKeyFile)
    throw new Error('--public-key or --public-key-file required')

if (program.publicKey && program.publicKeyFile)
    throw new Error('specify ONLY one of --public-key or --public-key-file')

var fs = require('fs');

var api = new DigitalOcean(program.apiKey, 10);


keysConfig = {
    name: "andriy",
    public_key: program.publicKey
};

/*api.accountAddKey(keysConfig, function (err, res, body) {
    console.log(body);
});*/


/*api.accountGetKeys({}, function (err, res, body) {
    console.log(body);
});*/

fs.readFile(__dirname + '/userdata.sh', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    console.log(data);
    create(data);
});

function create(data) {
    createDropletConfig = {
        "name": "andriy",
        "region": program.region,
        "size": "512mb",
        "image": "ubuntu-14-04-x64",
        "ssh_keys": [1747755],
        "backups": false,
        "ipv6": false,
        "user_data": data,
        "private_networking": null
    };

    var callback = function (err, res, body) {
        if (err)
            console.log("Error " + err);
        else
            console.log("Body " + util.inspect(body, {showHidden: true, depth: 10}));
    };

    if (0)
        api.accountGetKeys({}, callback);

    if (0)
        api.dropletsCreate(createDropletConfig, callback);

    if (0)
        api.dropletsGetAll({}, callback);

    var id = 12700973;
    if (0)
        api.dropletsDelete(id, callback);

    if (1)
        api.dropletsGetById(id, callback);

}