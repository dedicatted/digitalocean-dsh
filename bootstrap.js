#! /usr/bin/env node

const program = require('commander'),
    DigitalOcean = require('do-wrapper'),
    util = require('util'),
    Step = require('step'),
    prompt = require('prompt'),
    colors = require("colors/safe"),
    fs = require('fs'),
    UserMessageError = require('./user-message-error.js');

prompt.message = colors.rainbow('');
prompt.delimiter = colors.green('');


program
    .version(process.env.npm_package_version)
    .option('--name [droplet-name]', 'Droplet Name - Default dsh')
    .option('--api-key [api-key]', 'Digital Ocean Secret key')
    .option('--region [api-key]', 'region [fra1, nyc1-3]')
    .option('--public-key [public-key]', 'SSH Public Key')
    .option('--public-key-file [public-key-file]', 'Path to SSH Public Key File')
    .parse(process.argv);


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



var id = 0;
var ip;
var api;
var dropletName, publicKey, userData;

Step(

    function step1() {
        parseArgumentsAndCreateUserData(this)
    },
    function step2(err) {
        if (err) throw err;
        checkIfDropletExists(this)
    },
    function step3(err) {
        if (err) throw err;
        createAndInitDroplet(this)
    },
    function printErrors(err) {
        if(err instanceof UserMessageError) {
            console.log(err.message)
        }
    }
);

function parseArgumentsAndCreateUserData(nextStep) {
    Step(
        function readCommandLine() {
            dropletName = (program.dropletName) ? rogram.dropletName : 'andriy';

            if (!program.apiKey) throw new UserMessageError('--api-key required');

            if (!program.region) throw new UserMessageError('--region required');

            if (!program.publicKey && !program.publicKeyFile) throw new UserMessageError('--public-key or --public-key-file required')
            if (program.publicKey && !program.publicKeyFile) throw new UserMessageError('specify ONLY one of --public-key or --public-key-file')

            api = new DigitalOcean(program.apiKey, 10);

            if(program.publicKey) {
                publicKey = program.publicKey;
                return publicKey;
            } else {
                fs.readFile(program.publicKeyFile, 'utf8',  function (err,data) {
                    if (err) throw err;
                    publicKey = data;
                });
            }
        },
        function readUserDataTemplate(err) {
            if (err) throw err;
            fs.readFile(__dirname + '/userdata.sh', 'utf8', this);

        },
        function done (err,data) {
            if (err) throw err;
            userData = data.replace('$SSH_PUBLIC_KEY', publicKey);
            nextStep();
        }
    );
}

function checkIfDropletExists(nextStep) {
    Step(
        function getAll() {
            api.dropletsGetAll({}, this);
        },
        function checkIfExists(err, res, body) {
            if (err) {
                console.log("Can't get list of domain " + err);
                throw err;
            } else {
                for (var i = 0; i < body.droplets.length; i++) {
                    if (body.droplets[i].name.toUpperCase() === dropletName.toUpperCase()) {
                        id = body.droplets[i].id;
                        return true;
                    }
                }
                return false
            }
        },
        function proposeToDrop(err, exists) {
            if(exists) {
                prompt.start();
                const desription = util.format('Droplet with name \'%s\' already exists, would you like to delete it? (yes|no)', dropletName)

                var schema = {
                    properties: {
                        delete: {
                            description: desription,
                            message: "Please write 'yes' or 'no'",
                            required: true,
                            conform: function (value) {
                                return value === 'yes' || value === 'no';
                            },
                            before: function(value) { return  value === 'yes'; }
                        }
                    }
                }

                prompt.get(schema, this);
            } else {
                return {dropletNotExists: true};
            }
        },
        function dropIfConfirmed(err, result) {
            if(err) throw err;
            prompt.stop();
            if(result.dropletNotExists) {
                return null;
            } else if (result.delete) {
                console.log('Removing droplet with id [%s]', id);
                api.dropletsDelete(id, this);
            } else {
                console.log('Bye');
                process.exit(1);
            }
        },
        function checkSuccess(err, result, body) {
            if(err) {
                console.log('Failed to remove droplet with id [%s]', id);
                throw err;
            }
            if(result) {
                console.log("Droplet removed")
            }
            return nextStep();
        }
    );
}

function createAndInitDroplet(nextStep) {
    Step(
        function createDroplet() {
            var createDropletConfig = {
                "name": "andriy",
                "region": program.region,
                "size": "512mb",
                "image": "ubuntu-14-04-x64",
                "ssh_keys": [1747755],
                "backups": false,
                "ipv6": false,
                "user_data": userData,
                "private_networking": null
            };
            api.dropletsCreate(createDropletConfig, this);
        },
        function requestDropletIP(err, res, body) {
            if(err) throw err;
            id = body.droplet.id;

            setTimeout(this, 2000);
        },
        function dropletGetById() {
            api.dropletsGetById(id, this);
        },
        function getIP(err, res, body) {
            if(err) throw err;
            ip = body.droplet.networks.v4[0].ip_address;
            console.log('')
            console.log('Done')
            console.log('Droplet id [%s], name [%s], ip [%s]', id, dropletName, ip);
            console.log('ssh dsh@%s', ip);
            nextStep();
        }
    );

}
