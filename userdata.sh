#cloud-config
users:
  - name: dsh
    groups: sudo
    shell: /bin/bash
    sudo: ['ALL=(ALL) NOPASSWD:ALL']
    ssh-authorized-keys:
      - $SSH_PUBLIC_KEY
runcmd:
  - passwd -l dsh
  - touch /tmp/res.txt
  - apt-get update
  - apt-get install -y curl
  - apt-get install -y runit
  - apt-get install -y git
  - git clone https://github.com/kopachevsky/dsh.git /tmp/dsh
  - curl -sSL https://get.docker.com | sh
  - passwd -u dsh
  - usermod -aG docker dsh
  - chsh --shell /tmp/dsh/dsh dsh
