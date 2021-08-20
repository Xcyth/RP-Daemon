const express = require('express')
const app = express();

const { port, password } = require('../config.json')
const fs = require('fs');
const { exec } = require('child_process');

const proxyFileDir = "/etc/apache2/sites-enabled"

const protectedRoute = async (req, res, next) => {
    const reqToken = req.headers.authorization;
    if (!reqToken) {
        res.status(403).json({
            error: true,
            status: 403,
            message: "You did not provide any authorization headers"
        });
        return;
    }

    if (reqToken !== password) {
        res.status(403).json({
            error: true,
            status: 403,
            message: "The password you provided doesn't match the password required"
        });
        return;
    }

    next()
};

app.get('/', (req, res) => {
    res.send("OwO what are you doing here?")
})

app.post('/proxy/new', protectedRoute, (req, res) => {
    let data = req.body;
    let { url, destination } = data;

    let proxyFileTemplate = `<VirtualHost *:80>
	ServerName ${url}
	RewriteEngine On
	RewriteCond %{HTTPS} !=on
	RewriteRule ^/?(.*) https://${url}/$1 [R,L] 
</VirtualHost>
<VirtualHost *:443>
	ServerName ${url}
	ProxyRequests off
	SSLProxyEngine on
    ProxyPreserveHost On
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/${url}/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/${url}/privkey.pem
                                             
    <Location />
		ProxyPass ${destination}
        ProxyPassReverse ${destination}
    </Location>
</VirtualHost>`

    if (!(url || destination)) {
        res.status(204).json({
            error: true,
            status: 204,
            message: "You did not provide proper data"
        })
        return;
    }

    exec('certbot certonly -d ' + url + ' --non-interactive --webroot --webroot-path /var/www/html --agree-tos -m proxy@danbot.host', (error, stdout) => {
        let response = (error || stdout);

        if (response.includes("Congratulations!")) {
            fs.writeFileSync(`${proxyFileDir}/${url}.conf`, proxyFileTemplate)
            exec('service apache2 restart', (error, stdout) => {})

            res.status(200).json({
                error: false,
                status: 200,
                message: "Successfully linked domain."
            })
        } else {
            res.status(500).json({
                error: true,
                status: 500,
                message: "Something went wrong."
            })
        }
    })
})

app.post('/proxy/delete', protectedRoute, (req, res) => {
    let data = req.body;
    let { url } = data;

    if (!url) {
        res.status(204).json({
            error: true,
            status: 204,
            message: "You did not provide proper data"
        })
        return;
    }

    fs.unlinkSync(`${proxyFileDir}/${url}.conf`)
    exec('service apache2 restart', (error, stdout) => {})

    res.status(200).json({
        error: false,
        status: 200,
        message: "Successfully unlinked domain."
    })
})

app.listen(port, () => {
    console.log(`Reverse Proxy Daemon Running On Port ${port}`);
})