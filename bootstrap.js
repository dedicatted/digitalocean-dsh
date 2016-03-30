#! /usr/bin/env node

var program = require('commander'),
    DigitalOcean = require('do-wrapper'),
    util = require('util');
program
    .version(process.env.npm_package_version)
    .option('-ak, --api-key [api-key]', 'Digital Ocean Secret key')
    .parse(process.argv);

if (!program.apiKey)
    throw new Error('--api-key required')

var fs = require('fs');

var api = new DigitalOcean(program.apiKey, 10);

const SSH_PUBLIC_KEY = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCcOzW9+pNGzw4PQJn15HyjiPNhxASNfAqBzAVG4TNd4LvNLy4zukXps7BMlhBUb5q0EBK9BIgxgAOMHrfi3zl2jpA5QGJSBqGcN/+Kfj0XnP97oX/3cOlfKR8lYACPjr+ECG68rZsLD1mxbj0aPqf0126uc8NJlBxT+aritPFRhX4fT8zSW6Qb8KoqEDgYQCvNWwz79V6X3UxswbZ3OAEI+exoSKhbyW3ESxRIjjvfDmT3Fv/2fsrj1RZH83uim+kKolJX5Wychx+kQ3u6dMyACYyaA0gHSdxIZ5JQTtnYM/GAztoUdSkFbY83G97kqdRQQoNUqQyBWXQzOKnIDWOP kopachevsky@akopache.local'

keysConfig = {
    name: "andriy",
    public_key: SSH_PUBLIC_KEY
};

/*api.accountAddKey(keysConfig, function (err, res, body) {
    console.log(body);
});*/


/*api.accountGetKeys({}, function (err, res, body) {
    console.log(body);
});*/

fs = require('fs')
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
        "region": "fra1",
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
            console.log("error " + err);
        else
            console.log("Body " + util.inspect(body, {showHidden: true, depth: 10}));
    };

    if (0)
        api.accountGetKeys({}, callback);

    if (0)
        api.dropletsCreate(createDropletConfig, callback);

    if (0)
        api.dropletsGetAll({}, callback);

    var id = 12553016;
    if (0)
        api.dropletsDelete(id, callback);

    if (1)
        api.dropletsGetById(id, callback);

}