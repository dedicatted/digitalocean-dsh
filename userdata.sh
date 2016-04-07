#cloud-config
users:
  - name: dsh
    groups: sudo
    shell: /bin/bash
    sudo: ['ALL=(ALL) NOPASSWD:ALL']
runcmd:
  - touch /tmp/res.txt
  - apt-get update
  - apt-get install -y curl
  - apt-get install -y runit
  - apt-get install -y git
  - git clone https://github.com/kopachevsky/dsh.git /tmp/dsh
  - curl -sSL https://get.docker.com | sh
  - usermod -aG docker dsh
  - if [ ! -d /home/dsh/.ssh ]; then mkdir -p /home/dsh/.ssh && chmod 700 /home/dsh/.ssh && chown dsh:dsh /home/dsh/.ssh fi
  - if [ ! -f "/home/dsh/.ssh/authorized_keys" ]; then touch /home/dsh/.ssh/authorized_keys && chmod 600 /home/dsh/.ssh/authorized_keys &&chown dsh:dsh /home/dsh/.ssh/authorized_keys fi
  - echo "AAAAB3NzaC1yc2EAAAADAQABAAABAQCcOzW9+pNGzw4PQJn15HyjiPNhxASNfAqBzAVG4TNd4LvNLy4zukXps7BMlhBUb5q0EBK9BIgxgAOMHrfi3zl2jpA5QGJSBqGcN/+Kfj0XnP97oX/3cOlfKR8lYACPjr+ECG68rZsLD1mxbj0aPqf0126uc8NJlBxT+aritPFRhX4fT8zSW6Qb8KoqEDgYQCvNWwz79V6X3UxswbZ3OAEI+exoSKhbyW3ESxRIjjvfDmT3Fv/2fsrj1RZH83uim+kKolJX5Wychx+kQ3u6dMyACYyaA0gHSdxIZ5JQTtnYM/GAztoUdSkFbY83G97kqdRQQoNUqQyBWXQzOKnIDWOP kopachevsky@akopache.local" >> /home/dsh/.ssh/authorized_keys
  - chsh --shell /tmp/dsh/dsh dsh