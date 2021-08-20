# RP-Daemon

This is a Node.js application made to proxy websites using the apache2 module.
It handles the requests using http requests.

## Setting Up The Daemon
P.S: add sudo before the commands only if you aren't logged in as `root` and have sudo privilages on your account
1. Clone the repository to the `/root` folder by doing `cd /root` and then `git clone https://github.com/Xcyth/RP-Daemon/`
2. CD into the daemon `cd /root/RP-Daemon`
3. Run `npm i`
4. Run `nano /etc/systemd/system/proxy.service` and paste the following in there
   ```
   [Unit]
   Description=Reverse Proxy Daemon

   [Service]
   User=root
   #Group=some_group
   WorkingDirectory=/root/RP-Daemon
   LimitNOFILE=4096
   PIDFile=/root/RP-Daemon/daemon.pid
   ExecStart=/usr/bin/node /root/RP-Daemon/src/index.js
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
 5. Save it and exit out
 6. Run `systemctl enable --now proxy.service`
 7. Finally start the daemon by running `systemctl start proxy` and run `ps -ef | grep -v grep | grep proxy | awk '{ print $2 }' > proxy.pid` to generate the PID file

# Contributing
If you would like to contribute to this repository, feel free to make a pull request.

# Bug Reports
If you find any security vulnerabilities please email me at [xcyth@danbot.host](mailto://xcyth@danbot.host) or join the discord [server](https://discord.gg/dbh)
