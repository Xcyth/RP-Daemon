const express = require('express');
const { join } = require('path');
const { writeFileSync } = require('fs');
const { exec } = require('child_process');
const app = express();
const db = require('quick.db');
const domains = new db.table('domains');

const { port, password } = require(join(__dirname, '../config.json'));

// const template = readFileSync(join(__dirname, '../template.txt'));

const proxyFileDir = "/etc/apache2/sites-enabled";

const protectedRoute = async (req, res, next) => {
    const reqToken = req.headers.authorization;
    if (!reqToken) {
        return res.status(400).json({
            error: true,
            status: 400,
            message: "You did not provide any authorization headers"
        });
    }

    if (reqToken !== password) {
        return res.status(403).json({
            error: true,
            status: 403,
            message: "The password you provided doesn't match the password required"
        });
    }

    next()
};

app.use(express.json());

app.get('/', (req, res) => {
    return res.status(200).send("OwO what are you doing here?");
});

app.post('/proxy/new', protectedRoute, (req, res) => {
    if (!req.body || !req.body.url || !req.body.destination) {
        return res.status(400).json({
            error: true,
            status: 400,
            message: "You did not provide proper data"
        });
    }

    if (domains.has(req.body.url)) {
        return res.status(400).json({
            error: true,
            status: 400,
            message: "The domain you provided is already in use"
        });
    }

    const { url, destination } = req.body;

    const proxyFileTemplate = `<VirtualHost *:80>
	ServerName {url}
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

    exec('certbot certonly -d ' + url + ' --non-interactive --redirect --webroot --webroot-path /var/www/html --agree-tos -m proxy@listed.host', (error, stdout) => {
        const response = (error || stdout);

        if (response.includes("Congratulations!")) {
            writeFileSync(`${proxyFileDir}/${url}.conf`, proxyFileTemplate);
            exec('service apache2 restart', (error) => { if(error) return console.log('Problem restarting apache2!\n', error)});

            res.status(200).json({
                error: false,
                status: 200,
                message: "Successfully linked domain."
            });
        } else if (response.includes("Certificate not yet due for renewal")) {
            writeFileSync(`${proxyFileDir}/${url}.conf`, proxyFileTemplate);
            exec('service apache2 restart', (error) => { if(error) return console.log('Problem restarting apache2!\n', error)});

            res.status(200).json({
                error: false,
                status: 200,
                message: "Successfully linked domain."
            });
        } else {
            return res.status(500).json({
                error: true,
                status: 500,
                message: "Something went wrong."
            });
        }
    })
    
    domains.set(req.body.url, destination);
});

app.post('/proxy/delete', protectedRoute, (req, res) => {
    if (!req.body || !req.body.url) {
        return res.status(400).json({
            error: true,
            status: 400,
            message: "You did not provide proper data"
        })
    }

    if (!domains.has(req.body.url)) {
        return res.status(400).json({
            error: true,
            status: 400,
            message: "The domain you provided is not in use"
        })
    }

    const { url } = req.body;

    unlinkSync(`${proxyFileDir}/${url}.conf`)
    exec('service apache2 restart', (error) => { if(error) return console.log('Problem restarting apache2!\n', error)});

    res.status(200).json({
        error: false,
        status: 200,
        message: "Successfully unlinked domain."
    });

    domains.delete(url);
});

app.get('/proxy/list', protectedRoute, (req, res) => {
    res.status(200).json({
        error: false,
        status: 200,
        message: "Successfully listed domains.",
        domains: domains.all()
    });
});

app.get('/proxy/status', protectedRoute, (req, res) => {
    if (!req.query || !req.query.url) {
        return res.status(400).json({
            error: true,
            status: 400,
            message: "You did not provide proper data"
        });
    }

    if (!domains.has(req.query.url)) {
        return res.status(400).json({
            error: true,
            status: 400,
            message: "The domain you provided is not in use"
        });
    }

    const { url } = req.query;

    exec('certbot certificates', (error, stdout) => {
        const response = (error || stdout);
        
        if (response.includes(url)) {
            return res.status(200).json({
                error: false,
                status: 200,
                message: "Successfully listed domains.",
                status: "active"
            });
        } else {
            return res.status(200).json({
                error: false,
                status: 200,
                message: "Successfully listed domains.",
                status: "inactive"
            });
        }
    })
});

app.listen(port, () => {
    console.log(`Reverse Proxy Daemon Running On Port ${port}`);
});
