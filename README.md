# RP-Daemon

This is a Node.js application made to proxy websites using the apache2 module.
It handles the requests using http requests.

## Setting Up The Daemon
P.S: add sudo before the commands only if you aren't logged in as `root` and have sudo privilages on your account
1. Clone the repository to the `/root` folder by doing `sudo cd /root` and then `sudo git clone https://github.com/Xcyth/RP-Daemon/`
2. CD into the daemon `sudo cd /root/RP-Daemon`
3. Run `sudo npm i`
4. Run `nano /etc/systemd/system/proxy.service` and paste the following in there
   ```
   [Unit]
   Description=Reverse Proxy Daemon

   [Service]
   User=root
   #Group=some_group
   WorkingDirectory=/root/proxy-daemon
   LimitNOFILE=4096
   PIDFile=/root/DBHS-Daemon/daemon.pid
   ExecStart=/usr/bin/node /root/proxy-daemon/src/index.js
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
 5. Save it and exit out
 6. Run `systemctl enable --now proxy.service`
 7. Finally start the daemon by running `systemctl start proxy`

# Contributing
If you would like to contribute to this repository, feel free to make pull requests/

# Bug Reports
If you find any security vulnerabilities please email me at [xcyth@danbot.host](mailto://xcyth@danbot.host) or join the discord [server](https://discord.gg/dbh)
