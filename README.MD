Docker Shell DigitalOcean installer

# to create instance

1. git clone git@github.com:dedicatted/digitalocean-dsh.git
2. npm install
3. npm link
4. do-dsh --droplet-name mydroplet --droplet-size=512mb --root-key-name rootSSH --region nyc2 --api-key $DIDGITAL-OCEAN-TOKEN --public-key "SSH-PUBLIC-KEY"

# to drop by name
do-dsh drop --name mydroplet --api-key $DIDGITAL-OCEAN-TOKEN

# default properties

any property can be defined as default in USER_HOME/.do-dsh text file for example:

```
droplet-name=my-droplet-name
droplet-size=512mb
region=nyc2
api-key=xxxxxx
public-key="ssh-rsa xxxx"
root-key-name=ssh-file-name
size=512m
```