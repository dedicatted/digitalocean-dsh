Docker Shell DigitalOcean installer

# to create instance

1. git clone git@github.com:dedicatted/digitalocean-dsh.git
2. npm install
3. npm link
4. do-dsh --name mydroplet ----root-key-name rootSSH --region nyc2 --api-key $DIDGITAL-OCEAN-TOKEN --public-key "SSH-PUBLIC-KEY"

# to drop by name
do-dsh drop --name mydroplet --api-key $DIDGITAL-OCEAN-TOKEN