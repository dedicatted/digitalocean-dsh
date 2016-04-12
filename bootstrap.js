#! /usr/bin/env node

const program = require('commander'),
    DigitalOcean = require('do-wrapper'),
    util = require('util'),
    Step = require('step'),
    prompt = require('prompt'),
    colors = require("colors/safe"),
    fs = require('fs'),
    UserMessageError = require('./user-message-error.js'),
    userhome = require('userhome'),
    propertiesParser = require ("properties");

prompt.message = colors.rainbow('');
prompt.delimiter = colors.green('');


program
    .version(process.env.npm_package_version)
    .option('--droplet-name [droplet-name]', 'Droplet Name - Default dsh')
    .option('--droplet-size [droplet-size]', 'Droplet size 512mb, 1gb etc')
    .option('--api-key [api-key]', 'Digital Ocean Secret key')
    .option('--region [region]', 'region [fra1, nyc1-3]')
    .option('--root-key-name [root-key-name]', 'Name for ssh key installed on DigitalOcean for root access')
    .option('--public-key [public-key]', 'SSH Public Key')
    .option('--public-key-file [public-key-file]', 'Path to SSH Public Key File')
    .option('drop', 'just delete droplet, skip new one creation')
    .parse(process.argv);





var id = 0;
var ip;
var api;
var dropletName, publicKey, userData, rootKeyId;


Step(
    function step1() {
        parseArgumentsAndCreateUserData(this)
    },
    function step2(err) {
        if (err) throw err;
        if(!program.drop)
            findRootSSHKey(this);
        else return 0;
    },
    function step3(err) {
        if (err) throw err;
        checkIfDropletExists(this)
    },
    function step4(err) {
        if (err) throw err;
        if(!program.drop)
            createAndInitDroplet(this)
        else return;
    },
    function printErrors(err) {
        if(err instanceof UserMessageError) {
            console.log(err.message)
        } else throw err;
    }
);

function parseArgumentsAndCreateUserData(nextStep) {
    Step(
        function readProperties() {
            const configFile = userhome('.do-dsh');
            if(fs.existsSync(configFile)) {
                console.log("~/.do-dsh file found");
                propertiesParser.parse (configFile, { path: true }, this);
            }
        },
        function readCommandLine(err, properties) {
            if (err) throw err;

            var propNames = null;
            if(properties) {
                var oldNames = Object.keys(properties);
                propNames = Object.keys(properties).map(function (str) {
                    return str.replace(/-([a-z])/g, function (g) {
                        return g[1].toUpperCase();
                    })
                });

                for (var i = 0; i < propNames.length; i++) {
                    var propName = propNames[i];
                    if(!program[propName]) {
                        program[propName] = properties[oldNames[i]];
                    }
                }
            }

            if (!program.dropletName)
                throw new UserMessageError('--droplet-name required');

            dropletName = program.dropletName;
            console.log("Droplet " + dropletName);
            if (!program.apiKey)
                throw new UserMessageError('--api-key required');
            api = new DigitalOcean(program.apiKey, 10);


            if(!program.drop) {

                if (!program.dropletSize)
                    throw new UserMessageError('--size required');

                if (!program.region)
                    throw new UserMessageError('--region required');

                if (!program.publicKey && !program.publicKeyFile)
                    throw new UserMessageError('--public-key or --public-key-file required');

                if (!program.rootKeyName)
                    throw new UserMessageError('--root-key-name required');

                if (program.publicKey && program.publicKeyFile)
                    throw new UserMessageError('specify ONLY one of --public-key or --public-key-file');

                if (program.publicKey) {
                    publicKey = program.publicKey;
                    return publicKey;
                } else {
                    fs.readFile(program.publicKeyFile, 'utf8', function (err, data) {
                        if (err) throw err;
                        publicKey = data;
                    });
                }
            } else {
                return null;
            }
        },
        function readUserDataTemplate(err) {

            if (err) throw err;
            if(!program.drop)
                fs.readFile(__dirname + '/userdata.sh', 'utf8', this);
            else return null
        },
        function done (err,data) {
            if (err) throw err;
            if(!program.drop)
                userData = data.replace('$SSH_PUBLIC_KEY', publicKey);
            nextStep();
        }
    );
}


function findRootSSHKey(nextStep) {
    Step(
        function getKeys() {
            api.accountGetKeys({}, this);
        },
        function findKey(err, result, body) {
            if(err) throw err;
            for (var i = 0; i < body.ssh_keys.length; i++) {
                if (body.ssh_keys[i].name.toUpperCase() === program.rootKeyName.toUpperCase()) {
                    rootKeyId = body.ssh_keys[i].id;
                    return nextStep();
                }
            }
            throw new UserMessageError(util.format("SSH key '%s' could not be found in Digital Ocean", program.rootKeyName));
        }
    );
}


function checkIfDropletExists(nextStep) {
    Step(
        function getAll() {
            api.dropletsGetAll({}, this);
        },
        function checkIfExists(err, res, body) {
            if (err) throw err;
                for (var i = 0; i < body.droplets.length; i++) {
                    if (body.droplets[i].name.toUpperCase() === dropletName.toUpperCase()) {
                        id = body.droplets[i].id;
                        return true;
                    }
                }
                return false
        },
        function proposeToDrop(err, exists) {
            if(err) throw err;
            if(exists) {
                if(!program.drop) {
                    prompt.start();
                    const desription = util.format('Droplet with name \'%s\' already exists, would you like to delete it? (yes|no)', dropletName);

                    var schema = {
                        properties: {
                            delete: {
                                description: desription,
                                message: "Please write 'yes' or 'no'",
                                required: true,
                                conform: function (value) {
                                    return value === 'yes' || value === 'no';
                                },
                                before: function (value) {
                                    return value === 'yes';
                                }
                            }
                        }
                    };

                    prompt.get(schema, this);
                } else {
                    return {delete: true}
                }
            } else {
                return {dropletNotExists: true};
            }
        },
        function dropIfConfirmed(err, result) {
            if(err) throw err;
            prompt.stop();
            if(result.dropletNotExists) {
                if(!program.drop)
                    return null;
                else
                    throw new UserMessageError(util.format('Droplet with name \'%s\' does not exists', dropletName));
            } else if (result.delete) {
                console.log('Removing droplet with id [%s]', id);
                api.dropletsDelete(id, this);
            } else {
                console.log('Bye');
                process.exit(1);
            }
        },
        function checkSuccess(err, result) {
            if(err) throw err;
            if(result) {
                // if result not empty means we actually did call to server to delete droplet
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
                "name": program.dropletName,
                "region": program.region,
                "size": program.dropletSize,
                "image": "ubuntu-14-04-x64",
                "ssh_keys": [rootKeyId],
                "backups": false,
                "ipv6": false,
                "user_data": userData,
                "private_networking": null
            };
            console.log(util.inspect(createDropletConfig))
            api.dropletsCreate(createDropletConfig, this);
        },
        function requestDropletIP(err, res, body) {
            if(err) throw err;
            id = body.droplet.id;

            setTimeout(this, 2000);
        },
        function dropletGetById() {
            console.log("Id is", id);
            api.dropletsGetById(id, this);
        },
        function getIP(err, res, body) {
            if(err) throw err;
            ip = body.droplet.networks.v4[0].ip_address;
            console.log('');
            console.log('Done');
            console.log('Droplet id [%s], name [%s], ip [%s]', id, dropletName, ip);
            console.log('ssh dsh@%s', ip);
            nextStep();
        }
    );

}
